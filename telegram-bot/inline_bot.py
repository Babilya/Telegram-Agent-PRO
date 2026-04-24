"""BotFather companion bot — inline keyboards for SHADOW menu.

Userbots cannot receive callback_query (Telegram limitation), so this runs as
a separate Bot client using TELEGRAM_BOT_TOKEN. It mirrors the text commands
exposed by `bot_menu.py` but delivers them as InlineKeyboardButton callbacks.

Started lazily by `main.py` only when TELEGRAM_BOT_TOKEN is present.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

import httpx
from telethon import Button, TelegramClient, events

logger = logging.getLogger("inline_bot")

API_ID = int(os.environ.get("TELEGRAM_API_ID", "0"))
API_HASH = os.environ.get("TELEGRAM_API_HASH", "")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:8080")
SESSION_FILE = "telegram-bot/session/inline_bot"

_bot: Optional[TelegramClient] = None
_task: Optional[asyncio.Task] = None


def _menu_buttons() -> list[list[Button]]:
    return [
        [Button.inline("📨 Розсилки", b"campaigns"), Button.inline("👁️ Моніторинг", b"monitor")],
        [Button.inline("🤖 Автовідповіді", b"autoreplies"), Button.inline("📤 Пересилання", b"forwarding")],
        [Button.inline("🪞 Дзеркала", b"mirrors"), Button.inline("📜 Логи", b"logs")],
        [Button.inline("📊 Статистика", b"stats"), Button.inline("💬 Підтримка", b"support")],
        [Button.inline("ℹ️ Довідка", b"help"), Button.inline("❌ Закрити", b"close")],
    ]


async def _api_get(path: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=8) as http:
            r = await http.get(f"{NODE_API_URL}{path}")
            r.raise_for_status()
            return r.json()
    except Exception as e:
        return {"error": str(e)}


def _format_section(key: str, data: dict) -> str:
    if "error" in data:
        return f"⚠️ Не вдалося отримати дані: {data['error']}"
    if key == "campaigns":
        rows = data.get("campaigns", [])
        if not rows:
            return "📨 Розсилок поки немає."
        return "📨 Розсилки:\n" + "\n".join(
            f"• #{r['id']} — {r.get('name', '?')} ({r.get('status', '?')})" for r in rows[:10]
        )
    if key == "monitor":
        rows = data.get("keywords", [])
        if not rows:
            return "👁️ Моніторинг — слів ще немає."
        return "👁️ Ключові слова:\n" + "\n".join(
            f"• {r['word']} — {r.get('hits', 0)} спрацювань" for r in rows[:15]
        )
    if key == "autoreplies":
        rows = data.get("autoreplies", [])
        if not rows:
            return "🤖 Автовідповіді — порожньо."
        return "🤖 Автовідповіді:\n" + "\n".join(
            f"• «{r['trigger']}» → {r['reply'][:40]}…" for r in rows[:10]
        )
    if key == "forwarding":
        rows = data.get("filters", [])
        if not rows:
            return "📤 Пересилань поки немає."
        return "📤 Пересилання:\n" + "\n".join(
            f"• {r['sourceChat']} → {r['destChat']} ({r.get('forwarded', 0)})" for r in rows[:10]
        )
    if key == "mirrors":
        rows = data.get("mirrors", [])
        if not rows:
            return "🪞 Дзеркал поки немає."
        return "🪞 Дзеркала:\n" + "\n".join(
            f"• #{r['id']} — {r.get('ownerName', '?')} ({r.get('status', 'idle')})" for r in rows
        )
    if key == "logs":
        rows = data.get("logs", [])
        if not rows:
            return "📜 Логи порожні."
        return "📜 Останні логи:\n" + "\n".join(
            f"• [{r.get('eventType', '?')}] {r.get('chatTitle') or r.get('chatId', '?')}: "
            f"{(r.get('text') or '')[:60]}"
            for r in rows[:8]
        )
    if key == "stats":
        s = data
        return (
            "📊 Статистика:\n"
            f"• Груп: {s.get('groups', 0)}\n"
            f"• Кампаній: {s.get('campaigns', 0)}\n"
            f"• Контактів: {s.get('contacts', 0)}\n"
            f"• Логів: {s.get('messages', 0)}"
        )
    if key == "support":
        rows = data.get("tickets", [])
        if not rows:
            return "💬 Тікетів немає."
        return "💬 Тікети:\n" + "\n".join(
            f"• #{r['id']} — {r['subject']} ({r['status']})" for r in rows[:10]
        )
    if key == "help":
        return (
            "ℹ️ SHADOW AGENT PRO v3.8\n"
            "Це BotFather-компаньйон з інлайн-кнопками.\n"
            "Відкрий /menu, обери модуль — побачиш живу зведену інформацію з PostgreSQL."
        )
    return "—"


def _api_for_key(key: str) -> str:
    return {
        "campaigns": "/api/campaigns",
        "monitor": "/api/keywords",
        "autoreplies": "/api/autoreplies",
        "forwarding": "/api/forwarding",
        "mirrors": "/api/mirrors",
        "logs": "/api/logs?limit=8",
        "stats": "/api/stats/dashboard",
        "support": "/api/support",
        "help": "",
    }.get(key, "")


async def _start() -> None:
    global _bot
    if not (BOT_TOKEN and API_ID and API_HASH):
        logger.info("inline_bot: TELEGRAM_BOT_TOKEN/API creds missing — skipped")
        return
    bot = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await bot.start(bot_token=BOT_TOKEN)
    _bot = bot
    me = await bot.get_me()
    logger.info(f"inline_bot started as @{me.username}")

    @bot.on(events.NewMessage(pattern=r"^/(start|menu|help)$"))  # type: ignore[misc]
    async def on_menu(event: events.NewMessage.Event) -> None:
        await event.reply(
            "🌑 SHADOW AGENT PRO\nОбери модуль:",
            buttons=_menu_buttons(),
        )

    @bot.on(events.CallbackQuery())  # type: ignore[misc]
    async def on_cb(event: events.CallbackQuery.Event) -> None:
        key = event.data.decode("utf-8", "ignore")
        if key == "close":
            await event.delete()
            return
        path = _api_for_key(key)
        data = await _api_get(path) if path else {}
        text = _format_section(key, data)
        try:
            await event.edit(text, buttons=_menu_buttons())
        except Exception:
            await event.reply(text, buttons=_menu_buttons())
        await event.answer()

    await bot.run_until_disconnected()  # type: ignore[func-returns-value]


def start_in_background() -> Optional[asyncio.Task]:
    """Schedule the inline bot to run alongside the main service."""
    global _task
    if _task and not _task.done():
        return _task
    if not BOT_TOKEN:
        logger.info("inline_bot disabled: no TELEGRAM_BOT_TOKEN")
        return None

    async def _runner() -> None:
        try:
            await _start()
        except Exception as e:
            logger.error(f"inline_bot crashed: {e}")

    _task = asyncio.create_task(_runner())
    return _task


async def shutdown() -> None:
    global _task, _bot
    if _bot and _bot.is_connected():
        try:
            await _bot.disconnect()
        except Exception:
            pass
    if _task and not _task.done():
        _task.cancel()
        try:
            await _task
        except (asyncio.CancelledError, Exception):
            pass
    _task = None
    _bot = None
