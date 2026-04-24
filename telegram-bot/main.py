"""
Telegram Bot Service — FastAPI + Telethon
Handles: auth, group search, auto-join, broadcast campaigns, member parsing
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
import uvicorn
from telethon import TelegramClient
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.types import (
    Channel, Chat, InputPeerChannel,
    ChannelForbidden, ChatForbidden
)
from telethon.errors import (
    SessionPasswordNeededError, FloodWaitError,
    UserAlreadyParticipantError,
    ChatWriteForbiddenError, ChannelPrivateError
)
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from shadow_handlers import register_handlers, shadow_router
from bot_menu import register_menu
from mirror_manager import manager as mirror_mgr
import inline_bot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_ID = int(os.environ.get("TELEGRAM_API_ID", "0"))
API_HASH = os.environ.get("TELEGRAM_API_HASH", "")
SESSION_FILE = "telegram-bot/session/user_session"
NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")

# Internal API key — shared secret between Node and Python services
# Empty string = auth disabled (dev mode); set the env var in production
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")

os.makedirs("telegram-bot/session", exist_ok=True)

client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
scheduler = AsyncIOScheduler()
active_campaign_jobs: dict = {}

# ─── Security ───────────────────────────────────────────────────────────────────

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

NODE_API_ORIGIN = os.environ.get("NODE_API_ORIGIN", "http://localhost:8080")

async def verify_api_key(key: Optional[str] = Security(api_key_header)):
    if not INTERNAL_API_KEY or key == INTERNAL_API_KEY:
        return key
    raise HTTPException(status_code=403, detail="Invalid or missing API key")


# ─── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await client.connect()
        logger.info("Telethon client connected")
        if await client.is_user_authorized():
            me = await client.get_me()
            logger.info(f"Logged in as: {me.first_name} (@{me.username})")
        try:
            register_handlers(client)
        except Exception as e:
            logger.warning(f"Failed to register SHADOW handlers: {e}")
        try:
            register_menu(client)
        except Exception as e:
            logger.warning(f"Failed to register userbot menu: {e}")
    except Exception as e:
        logger.warning(f"Startup connect warning: {e}")

    scheduler.start()
    logger.info("Scheduler started")

    # Hourly "last seen long ago" notifier (>30 days inactive contacts).
    try:
        scheduler.add_job(
            check_inactive_contacts,
            IntervalTrigger(hours=1),
            id="last_seen_check",
            replace_existing=True,
            misfire_grace_time=600,
            next_run_time=datetime.now(),
        )
        logger.info("Scheduled inactive-contacts check (hourly)")
    except Exception as e:
        logger.warning(f"Failed to schedule inactive-check: {e}")

    # Restore active campaigns so jobs survive restarts (DB is the source of truth).
    try:
        import httpx as _httpx
        async with _httpx.AsyncClient(timeout=8.0) as _http:
            r = await _http.get(f"{NODE_API_URL}/api/campaigns")
            data = r.json()
            for c in data.get("campaigns", []):
                if c.get("status") != "running":
                    continue
                try:
                    camp = CampaignInfo(
                        id=c["id"], name=c.get("name", ""), message=c.get("message", ""),
                        status=c.get("status", "running"),
                        scheduleType=c.get("scheduleType", "hourly"),
                        intervalHours=c.get("intervalHours"),
                        targetGroupIds=c.get("targetGroupIds", []) or [],
                        delaySeconds=c.get("delaySeconds", 5),
                    )
                    if camp.scheduleType == "once":
                        continue
                    schedule_map = {
                        "hourly": 1.0, "every2h": 2.0, "every4h": 4.0,
                        "every8h": 8.0, "every12h": 12.0, "daily": 24.0,
                        "custom": camp.intervalHours,
                    }
                    hours = schedule_map.get(camp.scheduleType) or 1.0
                    job = scheduler.add_job(
                        send_campaign_broadcast, IntervalTrigger(hours=hours),
                        args=[camp], id=f"campaign_{camp.id}",
                        replace_existing=True, misfire_grace_time=3600,
                    )
                    active_campaign_jobs[camp.id] = job.id
                    logger.info(f"Restored campaign {camp.id} ({camp.scheduleType})")
                except Exception as ce:
                    logger.warning(f"Failed to restore campaign {c.get('id')}: {ce}")
    except Exception as e:
        logger.warning(f"Campaign restore skipped: {e}")

    # Start optional BotFather inline-keyboard companion
    inline_bot.start_in_background()

    yield

    scheduler.shutdown()
    await mirror_mgr.shutdown_all()
    await inline_bot.shutdown()
    if client.is_connected():
        await client.disconnect()


# ─── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Telegram Bot Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[NODE_API_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(shadow_router)


# ─── Mirror auth endpoints ──────────────────────────────────────────────────────

class MirrorSendCodeReq(BaseModel):
    apiId: int
    apiHash: str
    phone: str


class MirrorVerifyCodeReq(BaseModel):
    code: str


class MirrorVerifyPasswordReq(BaseModel):
    password: str


class MirrorStartReq(BaseModel):
    apiId: int
    apiHashEnc: str
    sessionString: str
    phone: Optional[str] = ""


@app.post("/mirrors/{mirror_id}/auth/send-code")
async def mirror_send_code(mirror_id: int, req: MirrorSendCodeReq):
    try:
        return await mirror_mgr.send_code(mirror_id, req.apiId, req.apiHash, req.phone)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mirrors/{mirror_id}/auth/verify-code")
async def mirror_verify_code(mirror_id: int, req: MirrorVerifyCodeReq):
    try:
        return await mirror_mgr.verify_code(mirror_id, req.code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mirrors/{mirror_id}/auth/verify-password")
async def mirror_verify_password(mirror_id: int, req: MirrorVerifyPasswordReq):
    try:
        return await mirror_mgr.verify_password(mirror_id, req.password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mirrors/{mirror_id}/start")
async def mirror_start(mirror_id: int, req: MirrorStartReq):
    try:
        return await mirror_mgr.start(mirror_id, req.apiId, req.apiHashEnc, req.sessionString, req.phone or "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/mirrors/{mirror_id}/stop")
async def mirror_stop(mirror_id: int):
    try:
        return await mirror_mgr.stop(mirror_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/mirrors/{mirror_id}/status")
async def mirror_status(mirror_id: int):
    return mirror_mgr.get_status(mirror_id)


# ─── Models ─────────────────────────────────────────────────────────────────────

class SendCodeRequest(BaseModel):
    phone: str

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str
    phoneCodeHash: str

class VerifyPasswordRequest(BaseModel):
    phone: Optional[str] = None
    password: str

class GroupInfo(BaseModel):
    id: int
    telegramId: str
    username: Optional[str] = None
    title: str

class JoinGroupsRequest(BaseModel):
    groups: list[GroupInfo]
    delaySeconds: int = 5

class CampaignInfo(BaseModel):
    id: int
    name: str
    message: str
    status: str
    scheduleType: str
    intervalHours: Optional[float] = None
    targetGroupIds: list[int]
    delaySeconds: int = 5

class StartCampaignRequest(BaseModel):
    campaign: CampaignInfo

class PauseCampaignRequest(BaseModel):
    campaignId: int

class ImportGroupsRequest(BaseModel):
    usernames: list[str]


# ─── Helpers ─────────────────────────────────────────────────────────────────────

async def check_inactive_contacts():
    """Notify owner about contacts not seen in >30 days. Runs hourly."""
    import httpx as _httpx
    from datetime import timedelta
    try:
        async with _httpx.AsyncClient(timeout=15.0) as http:
            r = await http.get(f"{NODE_API_URL}/api/profiles")
            data = r.json()
        threshold = datetime.now() - timedelta(days=30)
        stale = []
        for p in data.get("profiles", []):
            ls = p.get("lastSeen")
            if not ls:
                continue
            try:
                ts = datetime.fromisoformat(ls.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                continue
            if ts < threshold and (p.get("notes") or "").find("inactive_notified") < 0:
                stale.append(p)
        if not stale:
            return
        # Notify in Saved Messages (one bundled message; 5 max per hour).
        bundle = stale[:5]
        msg = "⚠️ Контакти неактивні >30 днів:\n" + "\n".join(
            f"• {p.get('firstName') or p.get('username') or p.get('telegramId')} "
            f"(остання активність {p.get('lastSeen', '?')[:10]})"
            for p in bundle
        )
        try:
            await client.send_message("me", msg)
        except Exception as e:
            logger.warning(f"inactive notify send failed: {e}")
        # Mark as notified so we don't spam.
        async with _httpx.AsyncClient(timeout=15.0) as http:
            for p in bundle:
                notes = (p.get("notes") or "") + " inactive_notified"
                try:
                    await http.patch(f"{NODE_API_URL}/api/profiles/{p['id']}", json={"notes": notes.strip()})
                except Exception:
                    pass
    except Exception as e:
        logger.error(f"check_inactive_contacts error: {e}")


async def resolve_entity(username: Optional[str], telegram_id: Optional[str]):
    """
    Resolve a Telegram entity. Always prefer username lookup first.
    Falls back to numeric ID only as a last resort (requires entity in cache).
    """
    if username:
        return await client.get_entity(username)
    if telegram_id:
        try:
            numeric_id = int(telegram_id)
        except (ValueError, TypeError):
            raise ValueError(f"telegramId '{telegram_id}' is not a valid integer")
        # get_entity by numeric ID only works if the entity is already in cache
        return await client.get_entity(numeric_id)
    raise ValueError("Neither username nor telegramId provided")


# ─── Auth ───────────────────────────────────────────────────────────────────────

@app.get("/auth/status")
async def auth_status(_key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        if await client.is_user_authorized():
            me = await client.get_me()
            return {
                "authenticated": True,
                "phone": me.phone if me else None,
                "username": me.username if me else None,
                "firstName": me.first_name if me else None,
                "id": me.id if me else None,
            }
    except Exception as e:
        logger.error(f"Auth status error: {e}")
    return {"authenticated": False, "phone": None, "username": None, "firstName": None, "id": None}


@app.post("/auth/send-code")
async def send_code(req: SendCodeRequest, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        result = await client.send_code_request(req.phone)
        return {
            "success": True,
            "message": "Code sent",
            "phoneCodeHash": result.phone_code_hash
        }
    except Exception as e:
        logger.error(f"Send code error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/verify-code")
async def verify_code(req: VerifyCodeRequest, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        await client.sign_in(phone=req.phone, code=req.code, phone_code_hash=req.phoneCodeHash)
        return {"success": True, "message": "Authenticated", "authenticated": True}
    except SessionPasswordNeededError:
        return {"success": True, "message": "2FA required", "requiresPassword": True, "requires2FA": True}
    except Exception as e:
        logger.error(f"Verify code error: {e}")
        return {"success": False, "message": str(e)}


@app.post("/auth/verify-password")
async def verify_password(req: VerifyPasswordRequest, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        await client.sign_in(password=req.password)
        me = await client.get_me()
        return {"success": True, "message": "Authenticated", "authenticated": True,
                "phone": me.phone if me else None, "username": me.username if me else None}
    except Exception as e:
        logger.error(f"Verify password error: {e}")
        return {"success": False, "message": str(e)}


@app.post("/auth/logout")
async def logout(_key: str = Depends(verify_api_key)):
    try:
        if client.is_connected():
            await client.log_out()
        return {"success": True, "message": "Logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": False, "message": str(e)}


@app.get("/auth/config")
async def get_auth_config(_key: str = Depends(verify_api_key)):
    api_id = os.environ.get("TELEGRAM_API_ID")
    api_hash = os.environ.get("TELEGRAM_API_HASH")
    return {"hasCredentials": bool(api_id and api_hash)}


# ─── Search ─────────────────────────────────────────────────────────────────────

@app.get("/search/groups")
async def search_groups(
    query: str = "",
    minMembers: Optional[int] = None,
    maxMembers: Optional[int] = None,
    limit: int = 20,
    groupType: str = "all",
    _key: str = Depends(verify_api_key),
):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            return {"results": [], "total": 0}

        results = []

        if query:
            search_result = await client(SearchRequest(
                q=query,
                limit=min(limit * 3, 100)
            ))

            for chat in search_result.chats:
                if isinstance(chat, (ChannelForbidden, ChatForbidden)):
                    continue

                members_count = getattr(chat, "participants_count", None)
                chat_type = "channel"
                if hasattr(chat, "megagroup") and chat.megagroup:
                    chat_type = "supergroup"
                elif isinstance(chat, Chat):
                    chat_type = "group"

                if groupType != "all" and chat_type != groupType:
                    continue
                if minMembers and members_count and members_count < minMembers:
                    continue
                if maxMembers and members_count and members_count > maxMembers:
                    continue

                username = getattr(chat, "username", None)
                results.append({
                    "id": str(chat.id),
                    "title": getattr(chat, "title", "Unknown"),
                    "username": username,
                    "membersCount": members_count,
                    "description": None,
                    "type": chat_type,
                    "isPublic": username is not None,
                    "inviteLink": f"https://t.me/{username}" if username else None,
                })

                if len(results) >= limit:
                    break

        return {"results": results[:limit], "total": len(results)}

    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"results": [], "total": 0}


# ─── Join Groups ────────────────────────────────────────────────────────────────

@app.post("/groups/join")
async def join_groups(req: JoinGroupsRequest, background_tasks: BackgroundTasks, _key: str = Depends(verify_api_key)):
    background_tasks.add_task(do_join_groups, req.groups, req.delaySeconds)
    return {"success": True, "message": f"Joining {len(req.groups)} groups in background"}


async def do_join_groups(groups: list[GroupInfo], delay_seconds: int):
    import httpx
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            logger.error("Not authenticated, cannot join groups")
            return

        async with httpx.AsyncClient(timeout=10.0) as http:
            for group in groups:
                status = "failed"
                error_msg = None
                max_retries = 2

                for attempt in range(max_retries):
                    try:
                        entity = await resolve_entity(group.username, group.telegramId)
                        await client(JoinChannelRequest(entity))
                        status = "joined"
                        logger.info(f"Joined {group.title}")
                        break

                    except UserAlreadyParticipantError:
                        logger.info(f"Already in {group.title}")
                        status = "joined"
                        break

                    except FloodWaitError as e:
                        logger.warning(f"Flood wait {e.seconds}s for {group.title} (attempt {attempt + 1})")
                        await asyncio.sleep(e.seconds)
                        # Retry same group after flood wait
                        if attempt == max_retries - 1:
                            error_msg = f"Flood wait: {e.seconds}s, max retries reached"
                        continue

                    except ChannelPrivateError:
                        error_msg = "Приватний канал — потрібне запрошення"
                        break

                    except Exception as e:
                        logger.error(f"Failed to join {group.title}: {e}")
                        error_msg = str(e)
                        break

                # Notify Node API of the result
                try:
                    await http.put(
                        f"{NODE_API_URL}/api/groups/join-status",
                        json={"id": group.id, "status": status, "error": error_msg}
                    )
                except Exception as e:
                    logger.warning(f"Failed to update join status for {group.title}: {e}")

                await asyncio.sleep(delay_seconds)

    except Exception as e:
        logger.error(f"Join groups task error: {e}")


# ─── Campaigns ──────────────────────────────────────────────────────────────────

@app.post("/campaigns/start")
async def start_campaign(req: StartCampaignRequest, background_tasks: BackgroundTasks, _key: str = Depends(verify_api_key)):
    campaign = req.campaign

    if campaign.id in active_campaign_jobs:
        return {"success": True, "message": "Campaign already running"}

    schedule_map = {
        "once": None,
        "hourly": 1.0,
        "every2h": 2.0,
        "every4h": 4.0,
        "every8h": 8.0,
        "every12h": 12.0,
        "daily": 24.0,
        "custom": campaign.intervalHours,
    }

    interval_hours = schedule_map.get(campaign.scheduleType)

    if campaign.scheduleType == "once":
        background_tasks.add_task(send_campaign_broadcast, campaign)
    else:
        hours = interval_hours or 1.0
        job = scheduler.add_job(
            send_campaign_broadcast,
            IntervalTrigger(hours=hours),
            args=[campaign],
            id=f"campaign_{campaign.id}",
            replace_existing=True,
            next_run_time=datetime.now(),
            misfire_grace_time=3600,
        )
        active_campaign_jobs[campaign.id] = job.id

    return {"success": True, "message": "Campaign started"}


@app.post("/campaigns/pause")
async def pause_campaign(req: PauseCampaignRequest, _key: str = Depends(verify_api_key)):
    job_id = f"campaign_{req.campaignId}"
    try:
        scheduler.remove_job(job_id)
        active_campaign_jobs.pop(req.campaignId, None)
    except Exception:
        pass
    return {"success": True, "message": "Campaign paused"}


async def send_campaign_broadcast(campaign: CampaignInfo):
    import httpx
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            logger.error("Not authenticated for broadcast")
            return

        async with httpx.AsyncClient(timeout=10.0) as http:
            groups_resp = await http.get(f"{NODE_API_URL}/api/groups")
            groups_data = groups_resp.json()
            all_groups = groups_data.get("groups", [])

        target_groups = [g for g in all_groups if g["id"] in campaign.targetGroupIds]
        sent = 0
        failed = 0

        delay = max(1, campaign.delaySeconds)

        for group in target_groups:
            try:
                entity = await resolve_entity(
                    group.get("username"),
                    group.get("telegramId")
                )
                await client.send_message(entity, campaign.message)
                sent += 1
                logger.info(f"[Campaign {campaign.id}] Sent to {group.get('title')}")
                await asyncio.sleep(delay)

            except ChatWriteForbiddenError:
                logger.warning(f"Cannot write to {group.get('title')}")
                failed += 1
            except FloodWaitError as e:
                logger.warning(f"Flood wait {e.seconds}s for campaign {campaign.id}")
                await asyncio.sleep(e.seconds)
                # Retry same group
                try:
                    entity = await resolve_entity(
                        group.get("username"),
                        group.get("telegramId")
                    )
                    await client.send_message(entity, campaign.message)
                    sent += 1
                except Exception as retry_e:
                    logger.error(f"Retry failed for {group.get('title')}: {retry_e}")
                    failed += 1
            except Exception as e:
                logger.error(f"Broadcast error for {group.get('title')}: {e}")
                failed += 1

        # Notify Node of completion
        async with httpx.AsyncClient(timeout=10.0) as http:
            await http.post(
                f"{NODE_API_URL}/api/campaigns/{campaign.id}/broadcast-done",
                json={"sent": sent, "failed": failed}
            )

        logger.info(f"Campaign {campaign.id} done: {sent} sent, {failed} failed")

    except Exception as e:
        logger.error(f"Broadcast task error: {e}")


# ─── Parse Members ──────────────────────────────────────────────────────────────

@app.get("/parse/members")
async def parse_members(group_username: str, limit: int = 500, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            return {"success": False, "message": "Not authenticated", "members": [], "total": 0}

        entity = await client.get_entity(group_username)
        participants = await client.get_participants(entity, limit=limit)

        members = []
        for p in participants:
            members.append({
                "id": p.id,
                "username": p.username,
                "firstName": p.first_name,
                "lastName": p.last_name,
                "phone": getattr(p, "phone", None),
                "isBot": getattr(p, "bot", False),
                "isPremium": getattr(p, "premium", False),
            })

        return {"success": True, "members": members, "total": len(members)}
    except Exception as e:
        logger.error(f"Parse members error: {e}")
        return {"success": False, "message": str(e), "members": [], "total": 0}


@app.get("/parse/dialogs")
async def get_dialogs(limit: int = 200, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            return {"success": False, "message": "Not authenticated", "dialogs": []}

        dialogs = await client.get_dialogs(limit=limit)
        result = []

        for dialog in dialogs:
            entity = dialog.entity
            if not isinstance(entity, (Channel, Chat)):
                continue
            if isinstance(entity, (ChannelForbidden, ChatForbidden)):
                continue

            members_count = getattr(entity, "participants_count", None)
            chat_type = "channel"
            if hasattr(entity, "megagroup") and entity.megagroup:
                chat_type = "supergroup"
            elif isinstance(entity, Chat):
                chat_type = "group"

            username = getattr(entity, "username", None)
            result.append({
                "telegramId": str(entity.id),
                "title": getattr(entity, "title", "Unknown"),
                "username": username,
                "membersCount": members_count,
                "type": chat_type,
                "identifier": username if username else str(entity.id),
            })

        return {"success": True, "dialogs": result, "total": len(result)}

    except Exception as e:
        logger.error(f"Get dialogs error: {e}")
        return {"success": False, "message": str(e), "dialogs": []}


@app.post("/parse/import-groups")
async def import_groups(req: ImportGroupsRequest, _key: str = Depends(verify_api_key)):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            return {"success": False, "message": "Not authenticated", "imported": [], "failed": []}

        imported = []
        failed = []

        for raw in req.usernames:
            username = raw.strip()
            username = username.replace("https://t.me/", "").replace("http://t.me/", "")
            username = username.lstrip("@")
            if not username:
                continue
            try:
                entity = await client.get_entity(username)
                members_count = getattr(entity, "participants_count", None)
                chat_type = "channel"
                if hasattr(entity, "megagroup") and entity.megagroup:
                    chat_type = "supergroup"
                elif isinstance(entity, Chat):
                    chat_type = "group"
                imported.append({
                    "telegramId": str(entity.id),
                    "title": getattr(entity, "title", username),
                    "username": getattr(entity, "username", None),
                    "membersCount": members_count,
                    "type": chat_type,
                })
            except Exception as e:
                failed.append({"username": username, "error": str(e)})

        return {"success": True, "imported": imported, "failed": failed}
    except Exception as e:
        logger.error(f"Import groups error: {e}")
        return {"success": False, "message": str(e), "imported": [], "failed": []}


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_BOT_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
