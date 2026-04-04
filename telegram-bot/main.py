"""
Telegram Bot Service — FastAPI + Telethon
Handles: auth, group search, auto-join, broadcast campaigns
"""

import asyncio
import logging
import os
import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from telethon import TelegramClient
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.functions.channels import JoinChannelRequest, GetFullChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest, GetDialogsRequest
from telethon.tl.types import (
    Channel, Chat, InputPeerEmpty, PeerChannel,
    ChannelForbidden, ChatForbidden
)
from telethon.errors import (
    SessionPasswordNeededError, FloodWaitError,
    UserAlreadyParticipantError, InviteHashInvalidError,
    ChatWriteForbiddenError, ChannelPrivateError
)
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_ID = int(os.environ.get("TELEGRAM_API_ID", "0"))
API_HASH = os.environ.get("TELEGRAM_API_HASH", "")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
PHONE = os.environ.get("TELEGRAM_PHONE", "")
SESSION_FILE = "telegram-bot/session/user_session"
NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")

os.makedirs("telegram-bot/session", exist_ok=True)

client = TelegramClient(SESSION_FILE, API_ID, API_HASH)

app = FastAPI(title="Telegram Bot Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()

pending_code_hash: dict = {}
active_campaign_jobs: dict = {}


# ─── Models ────────────────────────────────────────────────────────────────────

class SendCodeRequest(BaseModel):
    phone: str

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str
    phoneCodeHash: str

class VerifyPasswordRequest(BaseModel):
    password: str

class GroupInfo(BaseModel):
    id: int
    telegramId: str
    username: Optional[str]
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
    intervalHours: Optional[float]
    targetGroupIds: list[int]

class StartCampaignRequest(BaseModel):
    campaign: CampaignInfo

class PauseCampaignRequest(BaseModel):
    campaignId: int


# ─── Auth ───────────────────────────────────────────────────────────────────────

@app.get("/auth/status")
async def auth_status():
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
            }
    except Exception as e:
        logger.error(f"Auth status error: {e}")
    return {"authenticated": False, "phone": None, "username": None, "firstName": None}


@app.post("/auth/send-code")
async def send_code(req: SendCodeRequest):
    try:
        if not client.is_connected():
            await client.connect()
        result = await client.send_code_request(req.phone)
        pending_code_hash[req.phone] = result.phone_code_hash
        return {
            "success": True,
            "message": "Code sent",
            "phoneCodeHash": result.phone_code_hash
        }
    except Exception as e:
        logger.error(f"Send code error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/verify-code")
async def verify_code(req: VerifyCodeRequest):
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
async def verify_password(req: VerifyPasswordRequest):
    try:
        if not client.is_connected():
            await client.connect()
        await client.sign_in(password=req.password)
        return {"success": True, "message": "Authenticated", "authenticated": True}
    except Exception as e:
        logger.error(f"Verify password error: {e}")
        return {"success": False, "message": str(e)}


@app.post("/auth/logout")
async def logout():
    try:
        if client.is_connected():
            await client.log_out()
        return {"success": True, "message": "Logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": False, "message": str(e)}


@app.get("/auth/config")
async def get_auth_config():
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
    groupType: str = "all"
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
                if isinstance(chat, ChannelForbidden) or isinstance(chat, ChatForbidden):
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
async def join_groups(req: JoinGroupsRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(do_join_groups, req.groups, req.delaySeconds)
    return {"success": True, "message": f"Joining {len(req.groups)} groups in background"}


async def do_join_groups(groups: list[GroupInfo], delay_seconds: int):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            logger.error("Not authenticated, cannot join groups")
            return

        import httpx
        async with httpx.AsyncClient() as http:
            for group in groups:
                try:
                    if group.username:
                        entity = await client.get_entity(group.username)
                        await client(JoinChannelRequest(entity))
                        status = "joined"
                        logger.info(f"Joined {group.title}")
                    else:
                        logger.warning(f"No username for group {group.title}, skipping")
                        status = "failed"

                    await http.put(
                        f"{NODE_API_URL}/api/groups/join-status",
                        json={"id": group.id, "status": status}
                    )

                except UserAlreadyParticipantError:
                    logger.info(f"Already in {group.title}")
                    status = "joined"
                except FloodWaitError as e:
                    logger.warning(f"Flood wait {e.seconds}s")
                    await asyncio.sleep(e.seconds)
                except Exception as e:
                    logger.error(f"Failed to join {group.title}: {e}")

                await asyncio.sleep(delay_seconds)

    except Exception as e:
        logger.error(f"Join groups task error: {e}")


# ─── Campaigns ──────────────────────────────────────────────────────────────────

@app.post("/campaigns/start")
async def start_campaign(req: StartCampaignRequest, background_tasks: BackgroundTasks):
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
            next_run_time=datetime.now()
        )
        active_campaign_jobs[campaign.id] = job.id

    return {"success": True, "message": "Campaign started"}


@app.post("/campaigns/pause")
async def pause_campaign(req: PauseCampaignRequest):
    job_id = f"campaign_{req.campaignId}"
    try:
        scheduler.remove_job(job_id)
        active_campaign_jobs.pop(req.campaignId, None)
    except Exception:
        pass
    return {"success": True, "message": "Campaign paused"}


async def send_campaign_broadcast(campaign: CampaignInfo):
    try:
        if not client.is_connected():
            await client.connect()
        if not await client.is_user_authorized():
            logger.error("Not authenticated for broadcast")
            return

        import httpx
        async with httpx.AsyncClient() as http:
            groups_resp = await http.get(f"{NODE_API_URL}/api/groups")
            groups_data = groups_resp.json()
            all_groups = groups_data.get("groups", [])

        target_groups = [g for g in all_groups if g["id"] in campaign.targetGroupIds]
        sent = 0
        failed = 0

        for group in target_groups:
            try:
                username = group.get("username")
                telegram_id = group.get("telegramId")

                if username:
                    entity = await client.get_entity(username)
                elif telegram_id:
                    try:
                        entity = await client.get_entity(int(telegram_id))
                    except Exception:
                        logger.warning(f"Cannot find entity for {group.get('title')}")
                        failed += 1
                        continue
                else:
                    failed += 1
                    continue

                await client.send_message(entity, campaign.message)
                sent += 1
                logger.info(f"Sent to {group.get('title')}")
                await asyncio.sleep(3)

            except ChatWriteForbiddenError:
                logger.warning(f"Cannot write to {group.get('title')}")
                failed += 1
            except FloodWaitError as e:
                logger.warning(f"Flood wait {e.seconds}s")
                await asyncio.sleep(e.seconds)
                failed += 1
            except Exception as e:
                logger.error(f"Broadcast error for {group.get('title')}: {e}")
                failed += 1

        import httpx
        async with httpx.AsyncClient() as http:
            await http.post(
                f"{NODE_API_URL}/api/campaigns/{campaign.id}/broadcast-done",
                json={"sent": sent, "failed": failed}
            )

        logger.info(f"Campaign {campaign.id} done: {sent} sent, {failed} failed")

    except Exception as e:
        logger.error(f"Broadcast task error: {e}")


# ─── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    try:
        await client.connect()
        logger.info("Telethon client connected")
        if await client.is_user_authorized():
            me = await client.get_me()
            logger.info(f"Logged in as: {me.first_name} (@{me.username})")
    except Exception as e:
        logger.warning(f"Startup connect warning: {e}")

    scheduler.start()
    logger.info("Scheduler started")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    if client.is_connected():
        await client.disconnect()


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_BOT_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
