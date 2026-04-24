"""Per-mirror Telethon sub-client manager.

Each mirror = isolated TelegramClient with its own StringSession.
Auth state lives in memory during the phone→code→2FA flow; once authorised,
the session string is encrypted via Fernet and persisted to PostgreSQL by the
Express layer, so on next startup the client can be resumed.
"""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import httpx
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneCodeExpiredError
from telethon.sessions import StringSession

from crypto_utils import encrypt, decrypt

logger = logging.getLogger("mirror_manager")

NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")


@dataclass
class MirrorState:
    mirror_id: int
    api_id: int
    api_hash: str
    phone: str
    client: Optional[TelegramClient] = None
    phone_code_hash: Optional[str] = None
    status: str = "idle"  # idle|pending_code|pending_password|ready|running|error
    error: Optional[str] = None
    task: Optional[asyncio.Task] = field(default=None, repr=False)


class MirrorManager:
    def __init__(self) -> None:
        self._states: dict[int, MirrorState] = {}
        self._lock = asyncio.Lock()

    # ── Helpers ──────────────────────────────────────────────────────────────
    async def _patch_status(self, mirror_id: int, status: str, *, session_enc: Optional[str] = None,
                            api_hash_enc: Optional[str] = None, api_id: Optional[int] = None,
                            phone: Optional[str] = None) -> None:
        body: dict = {"status": status}
        if session_enc is not None:
            body["sessionString"] = session_enc
        if api_hash_enc is not None:
            body["apiHashEnc"] = api_hash_enc
        if api_id is not None:
            body["apiId"] = api_id
        if phone is not None:
            body["phone"] = phone
        try:
            async with httpx.AsyncClient(timeout=10) as http:
                await http.patch(
                    f"{NODE_API_URL}/api/mirrors/{mirror_id}",
                    json=body,
                    headers={"X-Internal": "1"},
                )
        except Exception as e:
            logger.warning(f"mirror status patch failed for {mirror_id}: {e}")

    def _state(self, mirror_id: int) -> Optional[MirrorState]:
        return self._states.get(mirror_id)

    def get_status(self, mirror_id: int) -> dict:
        st = self._state(mirror_id)
        if not st:
            return {"status": "idle", "running": False}
        return {
            "status": st.status,
            "running": st.task is not None and not st.task.done(),
            "phone": st.phone,
            "error": st.error,
        }

    # ── Auth flow ────────────────────────────────────────────────────────────
    async def send_code(self, mirror_id: int, api_id: int, api_hash: str, phone: str) -> dict:
        async with self._lock:
            await self._cleanup(mirror_id)
            client = TelegramClient(StringSession(), api_id, api_hash)
            await client.connect()
            try:
                result = await client.send_code_request(phone)
            except Exception as e:
                await client.disconnect()
                raise RuntimeError(f"send_code_request failed: {e}") from e
            st = MirrorState(
                mirror_id=mirror_id, api_id=api_id, api_hash=api_hash, phone=phone,
                client=client, phone_code_hash=result.phone_code_hash, status="pending_code",
            )
            self._states[mirror_id] = st
            await self._patch_status(mirror_id, "pending_code", phone=phone, api_id=api_id,
                                     api_hash_enc=encrypt(api_hash))
            return {"success": True, "status": "pending_code"}

    async def verify_code(self, mirror_id: int, code: str) -> dict:
        st = self._state(mirror_id)
        if not st or not st.client or not st.phone_code_hash:
            raise RuntimeError("no pending code request — call send_code first")
        try:
            await st.client.sign_in(phone=st.phone, code=code, phone_code_hash=st.phone_code_hash)
        except SessionPasswordNeededError:
            st.status = "pending_password"
            await self._patch_status(mirror_id, "pending_password")
            return {"success": True, "status": "pending_password", "needPassword": True}
        except (PhoneCodeInvalidError, PhoneCodeExpiredError) as e:
            st.error = str(e)
            await self._patch_status(mirror_id, "error")
            raise RuntimeError(f"invalid code: {e}") from e
        return await self._finalise_session(st)

    async def verify_password(self, mirror_id: int, password: str) -> dict:
        st = self._state(mirror_id)
        if not st or not st.client:
            raise RuntimeError("no pending password — call verify_code first")
        try:
            await st.client.sign_in(password=password)
        except Exception as e:
            st.error = str(e)
            await self._patch_status(mirror_id, "error")
            raise RuntimeError(f"invalid password: {e}") from e
        return await self._finalise_session(st)

    async def _finalise_session(self, st: MirrorState) -> dict:
        assert st.client is not None
        session_str = st.client.session.save()
        await st.client.disconnect()  # we'll reconnect on /start
        st.client = None
        st.phone_code_hash = None
        st.status = "ready"
        await self._patch_status(
            st.mirror_id, "ready",
            session_enc=encrypt(session_str),
            api_hash_enc=encrypt(st.api_hash),
            api_id=st.api_id,
            phone=st.phone,
        )
        return {"success": True, "status": "ready"}

    # ── Start / Stop ─────────────────────────────────────────────────────────
    async def start(self, mirror_id: int, api_id: int, api_hash_enc: str,
                    session_enc: str, phone: str = "") -> dict:
        st = self._state(mirror_id) or MirrorState(
            mirror_id=mirror_id, api_id=api_id, api_hash="", phone=phone,
        )
        if st.task and not st.task.done():
            return {"success": True, "status": "running", "alreadyRunning": True}

        api_hash = decrypt(api_hash_enc) or ""
        session_str = decrypt(session_enc) or ""
        if not api_hash or not session_str:
            raise RuntimeError("encrypted credentials cannot be decrypted")

        st.api_hash = api_hash
        client = TelegramClient(StringSession(session_str), api_id, api_hash)
        st.client = client
        await client.connect()
        if not await client.is_user_authorized():
            await client.disconnect()
            st.client = None
            st.status = "error"
            st.error = "session no longer authorised — re-authenticate"
            await self._patch_status(mirror_id, "error")
            raise RuntimeError(st.error)

        async def _run() -> None:
            try:
                await client.run_until_disconnected()  # type: ignore[func-returns-value]
            except Exception as e:
                logger.warning(f"mirror {mirror_id} disconnected: {e}")

        st.task = asyncio.create_task(_run())
        st.status = "running"
        self._states[mirror_id] = st
        await self._patch_status(mirror_id, "running")
        return {"success": True, "status": "running"}

    async def stop(self, mirror_id: int) -> dict:
        st = self._state(mirror_id)
        if not st:
            return {"success": True, "status": "idle"}
        await self._cleanup(mirror_id)
        await self._patch_status(mirror_id, "ready")
        return {"success": True, "status": "ready"}

    async def _cleanup(self, mirror_id: int) -> None:
        st = self._states.pop(mirror_id, None)
        if not st:
            return
        if st.task and not st.task.done():
            st.task.cancel()
            try:
                await st.task
            except (asyncio.CancelledError, Exception):
                pass
        if st.client and st.client.is_connected():
            try:
                await st.client.disconnect()
            except Exception:
                pass

    async def shutdown_all(self) -> None:
        for mid in list(self._states.keys()):
            await self._cleanup(mid)


manager = MirrorManager()
