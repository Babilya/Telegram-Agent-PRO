"""
SHADOW AGENT PRO — Telethon event handlers + OCR/Voice endpoints.
Imported by main.py to register events on the global `client`.
"""
import asyncio
import logging
import os
import tempfile
from typing import Optional

import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException
from telethon import events

from cache import cached

logger = logging.getLogger("shadow")

NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")
CACHE_TTL = float(os.environ.get("SHADOW_CACHE_TTL", "30"))

# Bounded queue to prevent memory exhaustion on burst events.
_event_queue: Optional[asyncio.Queue] = None
_worker_task: Optional[asyncio.Task] = None

shadow_router = APIRouter(prefix="", tags=["shadow"])


# ─── Background HTTP poster ─────────────────────────────────────────────────────

async def _post_log(payload: dict):
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            await http.post(f"{NODE_API_URL}/api/logs", json=payload)
    except Exception as e:
        logger.debug(f"log post failed: {e}")


async def _post_hit(entity: str, entity_id: int):
    """Increment hit/forwarded counter via dedicated endpoint."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            await http.post(f"{NODE_API_URL}/api/{entity}/{entity_id}/hit")
    except Exception:
        pass


async def _fetch_keywords_uncached() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            r = await http.get(f"{NODE_API_URL}/api/keywords")
            return r.json().get("keywords", [])
    except Exception:
        return []


async def _fetch_autoreplies_uncached() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            r = await http.get(f"{NODE_API_URL}/api/autoreplies")
            return r.json().get("autoreplies", [])
    except Exception:
        return []


async def _fetch_forward_filters_uncached() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http:
            r = await http.get(f"{NODE_API_URL}/api/forwarding")
            return r.json().get("filters", [])
    except Exception:
        return []


async def _fetch_keywords() -> list[dict]:
    return await cached("keywords", CACHE_TTL, _fetch_keywords_uncached)


async def _fetch_autoreplies() -> list[dict]:
    return await cached("autoreplies", CACHE_TTL, _fetch_autoreplies_uncached)


async def _fetch_forward_filters() -> list[dict]:
    return await cached("forwarding", CACHE_TTL, _fetch_forward_filters_uncached)


# ─── Event registration ─────────────────────────────────────────────────────────

def register_handlers(client):
    """Attach Telethon handlers to the running client."""

    @client.on(events.NewMessage(incoming=True))
    async def on_new_message(event):
        try:
            text = (event.raw_text or "").strip()
            chat = await event.get_chat()
            sender = await event.get_sender()
            chat_title = getattr(chat, "title", None) or getattr(chat, "first_name", "private")
            sender_name = (
                getattr(sender, "username", None)
                or getattr(sender, "first_name", None)
                or "unknown"
            )

            # 1a) Self-destruct media — download immediately before TG erases it.
            media_path: Optional[str] = None
            try:
                msg = event.message
                ttl = getattr(getattr(msg, "media", None), "ttl_seconds", None)
                if event.photo and ttl:
                    media_dir = "telegram-bot/media"
                    os.makedirs(media_dir, exist_ok=True)
                    fname = f"{int(asyncio.get_event_loop().time()*1000)}_{event.id}.jpg"
                    media_path = os.path.join(media_dir, fname)
                    await client.download_media(msg, file=media_path)
                    logger.info(f"📸 Self-destruct photo saved: {media_path} (ttl={ttl}s)")
                    try:
                        await client.send_message(
                            "me",
                            f"📸 Збережено фото з самознищенням ({ttl}с)\n"
                            f"Чат: {chat_title}\nВід: {sender_name}\n"
                            f"Шлях: {media_path}"
                        )
                    except Exception:
                        pass
            except Exception as e:
                logger.debug(f"self-destruct save error: {e}")

            # 1) Log message
            await _post_log({
                "chatId": str(event.chat_id),
                "chatTitle": chat_title,
                "senderId": str(event.sender_id) if event.sender_id else None,
                "senderName": sender_name,
                "messageId": str(event.id),
                "text": text[:2000],
                "mediaType": "photo" if event.photo else ("voice" if event.voice else None),
                "mediaPath": media_path,
                "eventType": "sent",
            })

            # 2) Keyword monitoring
            keywords = await _fetch_keywords()
            for kw in keywords:
                if not kw.get("enabled"):
                    continue
                w = kw.get("word", "")
                if w and w.lower() in text.lower():
                    try:
                        await client.send_message(
                            "me",
                            f"🔍 SHADOW: знайдено «{w}»\n"
                            f"Чат: {chat_title}\n"
                            f"Від: {sender_name}\n"
                            f"Текст: {text[:300]}"
                        )
                        # Fire-and-forget hit counter increment
                        asyncio.create_task(_post_hit("keywords", kw["id"]))
                    except Exception as e:
                        logger.warning(f"notify failed: {e}")

            # 3) Auto-replies (only in private chats)
            if event.is_private:
                replies = await _fetch_autoreplies()
                for ar in replies:
                    if not ar.get("enabled"):
                        continue
                    trig = (ar.get("trigger") or "").lower()
                    mt = ar.get("matchType", "contains")
                    matched = (
                        (mt == "exact" and text.lower() == trig)
                        or (mt == "contains" and trig in text.lower())
                        or (mt == "starts_with" and text.lower().startswith(trig))
                    )
                    if matched:
                        try:
                            await event.respond(ar.get("reply", ""))
                            asyncio.create_task(_post_hit("autoreplies", ar["id"]))
                            break
                        except Exception as e:
                            logger.warning(f"autoreply send failed: {e}")

            # 4) Forwarding filters
            filters = await _fetch_forward_filters()
            for f in filters:
                if not f.get("enabled"):
                    continue
                src = f.get("sourceChat", "")
                if src and src not in (str(event.chat_id), str(chat_title), getattr(chat, "username", "") or ""):
                    continue
                kw = f.get("keyword")
                if kw and kw.lower() not in text.lower():
                    continue
                dest = f.get("destChat")
                if dest:
                    try:
                        target = dest if not dest.lstrip("-").isdigit() else int(dest)
                        await client.forward_messages(target, event.message)
                        asyncio.create_task(_post_hit("forwarding", f["id"]))
                    except Exception as e:
                        logger.warning(f"forward failed to {dest}: {e}")

            # 5) Contact profile upsert
            if sender and event.sender_id:
                try:
                    async with httpx.AsyncClient(timeout=5.0) as http:
                        await http.post(f"{NODE_API_URL}/api/profiles/upsert", json={
                            "telegramId": str(event.sender_id),
                            "username": getattr(sender, "username", None),
                            "firstName": getattr(sender, "first_name", None),
                            "lastName": getattr(sender, "last_name", None),
                            "phone": getattr(sender, "phone", None),
                        })
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"on_new_message error: {e}")

    @client.on(events.MessageEdited)
    async def on_edited(event):
        try:
            await _post_log({
                "chatId": str(event.chat_id),
                "messageId": str(event.id),
                "text": (event.raw_text or "")[:2000],
                "eventType": "edited",
            })
        except Exception as e:
            logger.debug(f"edit log error: {e}")

    @client.on(events.MessageDeleted)
    async def on_deleted(event):
        try:
            for mid in event.deleted_ids:
                await _post_log({
                    "chatId": str(event.chat_id) if event.chat_id else "unknown",
                    "messageId": str(mid),
                    "eventType": "deleted",
                })
        except Exception as e:
            logger.debug(f"delete log error: {e}")

    logger.info("SHADOW event handlers registered (NewMessage, MessageEdited, MessageDeleted)")


# ─── OCR endpoint ───────────────────────────────────────────────────────────────

@shadow_router.post("/ocr/recognize")
async def ocr_recognize(image: UploadFile = File(...)):
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="OCR недоступний: встановіть pytesseract + Pillow + системний tesseract",
        )

    try:
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(image.filename or "img.png")[1], delete=False) as tmp:
            tmp.write(await image.read())
            tmp_path = tmp.name

        try:
            img = Image.open(tmp_path)
            text = pytesseract.image_to_string(img, lang="ukr+eng")
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        return {"success": True, "text": text.strip()}
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR error: {e}")


# ─── Voice transcribe endpoint ──────────────────────────────────────────────────

_whisper_model = None

def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _whisper_model


@shadow_router.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...)):
    try:
        from faster_whisper import WhisperModel  # noqa: F401
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Whisper недоступний: встановіть faster-whisper",
        )

    try:
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(audio.filename or "voice.ogg")[1], delete=False) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        try:
            model = _get_whisper()
            segments, info = model.transcribe(tmp_path, language=None)
            text = " ".join(seg.text for seg in segments).strip()
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        return {"success": True, "text": text, "language": info.language if hasattr(info, "language") else None}
    except Exception as e:
        logger.error(f"Voice transcribe error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {e}")
