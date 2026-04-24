"""
SHADOW AGENT PRO — userbot text-command menu.
Activated by sending commands to Saved Messages (chat with yourself).

Commands:
  /menu              — main menu
  /help              — list of commands
  /stats             — global statistics
  /keywords          — list active keywords
  /add_kw <word>     — add keyword
  /del_kw <id>       — delete keyword
  /autoreplies       — list autoreplies
  /add_ar <trig>|<reply>
                     — add autoreply (separator: |)
  /del_ar <id>       — delete autoreply
  /forwarding        — list forward filters
  /add_fw <src>|<dst>[|<keyword>]
                     — add forward filter
  /del_fw <id>       — delete filter
  /mirrors           — list mirrors
  /logs [n]          — last n message logs (default 10)
  /clear_logs        — wipe logs
  /support <subj>|<msg>
                     — open ticket
"""
import logging
import os

import httpx
from telethon import events

from cache import invalidate

logger = logging.getLogger("bot_menu")
NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")

# ─── Menu text (stylised) ───────────────────────────────────────────────────────

MAIN_MENU = """\
══════════════════════════
  🌑 SHADOW AGENT PRO
══════════════════════════

📡 Моніторинг
  /keywords      слова
  /add_kw тест   додати
  /del_kw 5      видалити

🤖 Автовідповіді
  /autoreplies
  /add_ar тригер|відповідь
  /del_ar 3

↪️ Пересилання
  /forwarding
  /add_fw src|dst|kw
  /del_fw 1

🪞 Дзеркала   /mirrors
📊 Статистика /stats
📜 Логи       /logs 20
🧹 Очистити   /clear_logs
🛟 Підтримка  /support тема|текст

❓ Допомога   /help
══════════════════════════"""


def _hr() -> str:
    return "──────────────────────────"


# ─── HTTP helpers ───────────────────────────────────────────────────────────────

async def _get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=8.0) as http:
        r = await http.get(f"{NODE_API_URL}{path}")
        return r.json()


async def _post(path: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=8.0) as http:
        r = await http.post(f"{NODE_API_URL}{path}", json=payload)
        return r.json()


async def _delete(path: str) -> dict:
    async with httpx.AsyncClient(timeout=8.0) as http:
        r = await http.delete(f"{NODE_API_URL}{path}")
        return r.json()


# ─── Reply formatters ───────────────────────────────────────────────────────────

def _fmt_list(title: str, items: list[str], empty: str) -> str:
    body = "\n".join(items) if items else f"  {empty}"
    return f"══ {title} ══\n{body}\n{_hr()}\n[ /menu ] [ /help ]"


# ─── Command registration ──────────────────────────────────────────────────────

def register_menu(client):
    """Register text-command handlers in Saved Messages."""

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/menu$"))
    async def _menu(event):
        await event.respond(MAIN_MENU)

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/help$"))
    async def _help(event):
        await event.respond(__doc__)

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/stats$"))
    async def _stats(event):
        try:
            s = await _get("/api/shadow/stats")
            txt = (
                "══ 📊 СТАТИСТИКА ══\n"
                f"  Ключових слів:   {s.get('keywords', 0)}\n"
                f"  Автовідповідей:  {s.get('autoreplies', 0)}\n"
                f"  Фільтрів:        {s.get('forwardFilters', 0)}\n"
                f"  Дзеркал:         {s.get('mirrors', 0)}\n"
                f"  Логів повідомл.: {s.get('messageLogs', 0)}\n"
                f"  Контактів:       {s.get('contactProfiles', 0)}\n"
                f"  Тікетів:         {s.get('supportTickets', 0)}\n"
                f"{_hr()}\n[ /menu ]"
            )
            await event.respond(txt)
        except Exception as e:
            await event.respond(f"❌ Помилка: {e}")

    # ── Keywords ────────────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/keywords$"))
    async def _list_kw(event):
        data = await _get("/api/keywords")
        items = [
            f"  [{k['id']}] {'🟢' if k['enabled'] else '⏸'} «{k['word']}»  hits: {k.get('hits', 0)}"
            for k in data.get("keywords", [])
        ]
        await event.respond(_fmt_list("🔍 КЛЮЧОВІ СЛОВА", items, "немає"))

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/add_kw\s+(.+)$"))
    async def _add_kw(event):
        word = event.pattern_match.group(1).strip()
        res = await _post("/api/keywords", {"word": word})
        invalidate("keywords")
        if res.get("success"):
            await event.respond(f"✅ Додано слово «{word}» (id={res['keyword']['id']})")
        else:
            await event.respond(f"❌ {res.get('message', 'помилка')}")

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/del_kw\s+(\d+)$"))
    async def _del_kw(event):
        kid = event.pattern_match.group(1)
        await _delete(f"/api/keywords/{kid}")
        invalidate("keywords")
        await event.respond(f"🗑 Видалено слово id={kid}")

    # ── Auto-replies ───────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/autoreplies$"))
    async def _list_ar(event):
        data = await _get("/api/autoreplies")
        items = [
            f"  [{a['id']}] {'🟢' if a['enabled'] else '⏸'} «{a['trigger']}»\n      → {a['reply'][:50]}"
            for a in data.get("autoreplies", [])
        ]
        await event.respond(_fmt_list("🤖 АВТОВІДПОВІДІ", items, "немає"))

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/add_ar\s+(.+)$"))
    async def _add_ar(event):
        raw = event.pattern_match.group(1)
        if "|" not in raw:
            await event.respond("❌ Формат: /add_ar тригер|відповідь")
            return
        trig, reply = raw.split("|", 1)
        res = await _post("/api/autoreplies", {"trigger": trig.strip(), "reply": reply.strip()})
        invalidate("autoreplies")
        if res.get("success"):
            await event.respond(f"✅ Правило додано (id={res['autoreply']['id']})")
        else:
            await event.respond(f"❌ {res.get('message', 'помилка')}")

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/del_ar\s+(\d+)$"))
    async def _del_ar(event):
        aid = event.pattern_match.group(1)
        await _delete(f"/api/autoreplies/{aid}")
        invalidate("autoreplies")
        await event.respond(f"🗑 Видалено правило id={aid}")

    # ── Forwarding ─────────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/forwarding$"))
    async def _list_fw(event):
        data = await _get("/api/forwarding")
        items = [
            f"  [{f['id']}] {'🟢' if f['enabled'] else '⏸'} {f['sourceChat']} → {f['destChat']}"
            f"\n      kw: {f.get('keyword') or '*все*'} • forwarded: {f.get('forwarded', 0)}"
            for f in data.get("filters", [])
        ]
        await event.respond(_fmt_list("↪️ ПЕРЕСИЛАННЯ", items, "немає"))

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/add_fw\s+(.+)$"))
    async def _add_fw(event):
        parts = [p.strip() for p in event.pattern_match.group(1).split("|")]
        if len(parts) < 2:
            await event.respond("❌ Формат: /add_fw src|dst[|keyword]")
            return
        payload = {"sourceChat": parts[0], "destChat": parts[1]}
        if len(parts) > 2 and parts[2]:
            payload["keyword"] = parts[2]
        res = await _post("/api/forwarding", payload)
        invalidate("forwarding")
        if res.get("success"):
            await event.respond(f"✅ Фільтр додано (id={res['filter']['id']})")
        else:
            await event.respond(f"❌ {res.get('message', 'помилка')}")

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/del_fw\s+(\d+)$"))
    async def _del_fw(event):
        fid = event.pattern_match.group(1)
        await _delete(f"/api/forwarding/{fid}")
        invalidate("forwarding")
        await event.respond(f"🗑 Видалено фільтр id={fid}")

    # ── Mirrors ────────────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/mirrors$"))
    async def _list_mr(event):
        data = await _get("/api/mirrors")
        items = [
            f"  [{m['id']}] {m['ownerName']}  🔑 {m['accessKey']}"
            for m in data.get("mirrors", [])
        ]
        await event.respond(_fmt_list("🪞 ДЗЕРКАЛА", items, "немає"))

    # ── Logs ───────────────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/logs(?:\s+(\d+))?$"))
    async def _logs(event):
        n = int(event.pattern_match.group(1) or 10)
        n = min(n, 50)
        data = await _get(f"/api/logs?limit={n}")
        items = []
        for l in data.get("logs", []):
            tag = "🗑" if l.get("eventType") == "deleted" else ("✏️" if l.get("eventType") == "edited" else "💬")
            txt = (l.get("text") or "")[:80]
            items.append(f"  {tag} {l.get('senderName', '?')} @ {l.get('chatTitle', '?')}\n      {txt}")
        await event.respond(_fmt_list(f"📜 ЛОГИ (last {n})", items, "немає"))

    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/clear_logs$"))
    async def _clear(event):
        await _delete("/api/logs/all")
        await event.respond("🧹 Логи очищено")

    # ── Support ────────────────────────────────────────────────────────────────
    @client.on(events.NewMessage(chats="me", outgoing=True, pattern=r"^/support\s+(.+)$"))
    async def _support(event):
        raw = event.pattern_match.group(1)
        if "|" not in raw:
            await event.respond("❌ Формат: /support тема|повідомлення")
            return
        subj, msg = raw.split("|", 1)
        res = await _post("/api/support", {"subject": subj.strip(), "message": msg.strip()})
        if res.get("success"):
            await event.respond(f"✅ Тікет створено (id={res['ticket']['id']})")
        else:
            await event.respond(f"❌ {res.get('message', 'помилка')}")

    logger.info(
        "SHADOW userbot menu registered: /menu /stats /keywords /autoreplies "
        "/forwarding /mirrors /logs /support"
    )
