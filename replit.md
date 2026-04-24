# SHADOW AGENT PRO v3.8 — Telegram Group Manager

## Overview

Full-stack Telegram юзербот SHADOW AGENT PRO: Python bot (Telethon) + Node.js API + React web dashboard.
Includes 14 модулів: розсилки, моніторинг, логи, досьє контактів, автовідповіді, пересилання,
пошук груп, вступ у групи, OCR, голосові→текст, дзеркала, статистика, налаштування, підтримка.
Plus reference catalog with FAQ, error codes (E001-E012), full guide and security policy.

## Modules / Pages

- `/dashboard` — Огляд (stats + activity)
- `/campaigns` — Розсилки
- `/monitor` — Моніторинг ключових слів
- `/logs` — Логи (повідомлення, медіа, видалені)
- `/contacts` — Досьє контактів
- `/autoreplies` — Автовідповіді (тригер→відповідь)
- `/forwarding` — Пересилання
- `/search`, `/groups`, `/parsers` — Групи
- `/ocr` — OCR (фото→текст)
- `/voice` — Голосові→текст (Whisper)
- `/mirrors` — Дзеркала бота
- `/stats` — Статистика
- `/support` — Підтримка
- `/profile` — Мій профіль
- `/help` — Довідковий каталог (Каталог/Швидко/Гід/FAQ/Помилки/Безпека)
- `/menu` — Хаб усіх модулів
- `/settings` — Налаштування

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Python**: 3.11 (Telethon, FastAPI, APScheduler, httpx)
- **Package manager**: pnpm (Node), pip (Python)
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + TailwindCSS (dark, neon purple/pink theme)
- **Build**: esbuild (CJS bundle)

## Services

| Service | Port | Description |
|---|---|---|
| React Dashboard | 20141 | Web UI for managing groups/campaigns |
| Express API | 8080 | REST API proxy + DB operations |
| Python Bot | 8001 | Telethon client: search, join, broadcast, parse |

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `python telegram-bot/main.py` — run Python bot service

## Features

1. **Auth**: Telegram login via phone/code/2FA password (Telethon)
2. **Group Search**: Search by keyword, filter by type/min-max members, save + join from results
3. **Saved Groups**: Save, bulk-select, auto-join groups with configurable delay (2s-2min)
4. **Bulk Import**: Paste @usernames/t.me links → resolve via Telethon → save to DB
5. **Campaigns**: Create broadcast campaigns with schedule (once/hourly/2h/4h/8h/12h/daily/custom)
6. **Broadcast**: Configurable delay between messages, stats (sent/failed), job history
7. **Job History**: Full log of join and broadcast operations (accessible at /jobs)
8. **Parser**: Fetch members from any joined group via Telethon get_participants
9. **Contacts**: Save parsed members to DB, filter, CSV export, delete all
10. **Dialogs**: Fetch real Telegram chats from user account for parser group selection
11. **Settings**: Real-time health check of API + Python service with ping latency

## Environment Secrets Required

- `TELEGRAM_API_ID` — from https://my.telegram.org/apps
- `TELEGRAM_API_HASH` — from https://my.telegram.org/apps
- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `TELEGRAM_PHONE` — user phone number (+380...)
- `DATABASE_URL` — auto-provisioned PostgreSQL
- `SESSION_SECRET` — for session management
- `INTERNAL_API_KEY` — shared secret between Node and Python services (auto-generated if not set)
- `NODE_API_ORIGIN` — origin of Node API (used by Python CORS, default: http://localhost:8080)

## Security Architecture

- Python service requires `X-API-Key: <INTERNAL_API_KEY>` header on all endpoints
- Node API injects this key via `pythonHeaders()` in `src/lib/config.ts`
- CORS on Python limited to `NODE_API_ORIGIN` only (not wildcard)
- All IDs validated via `parsedId()` helper — returns 400 on NaN inputs

## Key Architecture Decisions

- `PYTHON_SERVICE_URL` centralized in `artifacts/api-server/src/lib/config.ts`
- Campaign start is atomic: Python is contacted BEFORE DB status is updated to "active"
- **Campaign recovery**: on API server startup, active campaigns are re-registered with Python (handles restarts)
- join-status callback does UPDATE first, INSERT only if no existing record (avoids duplicate jobs)
- Contact filtering uses SQL WHERE clause (not in-memory Node.js)
- Contacts endpoint is paginated: `limit` (max 1000, default 200) + `offset` params
- **Rate limiting**: 300 req/min per IP via express-rate-limit; `/api/health` is exempt
- Express `trust proxy` set to `1` so rate-limit works correctly behind Replit's reverse proxy
- Parse timeout is 55s (below 60s proxy limit)
- Auth modal race condition fixed: single useEffect for step initialization (no setTimeout fallback)
- **Auth guard**: all inner routes check `/api/auth/status`; unauthenticated users see auth modal
- apiid/apihash UI steps removed — credentials must be set as env vars
- `window.confirm()` replaced with AlertDialog (works in iframe/proxy environments)
- Nested FormField with same name fixed with useWatch + direct form.setValue
- FloodWait retry: same group retried after sleep, not skipped
- Python uses lifespan event handlers (no DeprecationWarning)
- DB indexes added on: `groups.status`, `jobs.status`, `jobs.campaign_id`, `jobs.created_at`, `parsed_contacts.source_group`, `parsed_contacts.created_at`, `parsed_contacts.telegram_id`

## DB Schema

- `groups` — saved Telegram groups (status: saved/joined/pending/failed)
- `campaigns` — broadcast campaigns with schedule and stats
- `jobs` — job execution history (type: join/broadcast)
- `parsed_contacts` — parsed Telegram members from groups

## Navigation

- `/dashboard` — Overview with stats, quick actions, recent activity
- `/search` — Search Telegram groups by keyword + filters
- `/groups` — Saved groups list with bulk join + import
- `/campaigns` — Campaigns list with start/pause/delete + delay config
- `/campaigns/new` — Create new campaign
- `/campaigns/:id/edit` — Edit existing campaign
- `/parsers` — Parse group members + save contacts to DB
- `/settings` — Account status, API credentials, real service health check
- `/jobs` — Full job history log (accessible from dashboard "Всі задачі" link)

## API Routes (Express :8080)

### Auth (proxy to Python)
- `GET /api/auth/status` — check if Telegram account connected
- `POST /api/auth/send-code` — send phone code
- `POST /api/auth/verify-code` — verify code (handles 2FA)
- `POST /api/auth/verify-password` — verify 2FA password
- `POST /api/auth/logout` — disconnect account

### Groups
- `GET /api/groups?status=` — list groups with filter
- `POST /api/groups` — save group to DB
- `PUT /api/groups/:id` — update group
- `DELETE /api/groups/:id` — delete group
- `POST /api/groups/join` — start async join (creates job records, returns jobIds)
- `PUT /api/groups/join-status` — Python callback when join completes (creates job log)

### Search (proxy to Python)
- `GET /api/search/groups?query=&minMembers=&maxMembers=&groupType=` — Telethon SearchRequest

### Campaigns
- `GET /api/campaigns` — list all campaigns
- `POST /api/campaigns` — create campaign
- `GET /api/campaigns/:id` — get campaign by ID
- `PUT /api/campaigns/:id` — update campaign
- `DELETE /api/campaigns/:id` — delete campaign
- `POST /api/campaigns/:id/start` — start (activates Python scheduler)
- `POST /api/campaigns/:id/pause` — pause (stops Python scheduler)
- `POST /api/campaigns/:id/broadcast-done` — Python callback with stats

### Jobs
- `GET /api/jobs?limit=` — list job history

### Stats
- `GET /api/stats/dashboard` — dashboard statistics

### Parse (proxy to Python)
- `GET /api/parse/members?groupUsername=&limit=` — get participants via Telethon
- `GET /api/parse/dialogs?limit=` — get user's Telegram dialogs (chats)
- `POST /api/parse/import-groups` — resolve usernames + save to DB

### Contacts
- `GET /api/contacts?search=&sourceGroup=&limit=&offset=` — list saved contacts (paginated, max 1000/page, default 200)
- `POST /api/contacts/batch` — save multiple contacts to DB
- `DELETE /api/contacts/all` — clear all contacts

### Health
- `GET /api/healthz` — API health
- `GET /api/health/services` — ping all services, return latency

## Python Endpoints (:8001)

- `GET /auth/status` — Telegram auth status + user info
- `POST /auth/send-code` — send SMS code via Telethon
- `POST /auth/verify-code` — verify code (handles SessionPasswordNeededError → 2FA)
- `POST /auth/verify-password` — verify 2FA password
- `POST /auth/logout` — logout from Telegram
- `GET /search/groups?query=&minMembers=&maxMembers=&limit=&groupType=` — search via SearchRequest
- `POST /groups/join` — async join groups (calls back /api/groups/join-status per group)
- `POST /campaigns/start` — start scheduler/immediate broadcast
- `POST /campaigns/pause` — stop scheduler
- `GET /parse/members?group_username=&limit=` — get_participants
- `GET /parse/dialogs?limit=` — get_dialogs (all user chats)
- `POST /parse/import-groups` — resolve + return group metadata (saved in Express)

## Color Scheme

- Primary: `hsl(271 91% 65%)` (purple)
- Accent: `hsl(316 90% 62%)` (pink)
- Sub: `hsl(258 15% 70%)`
- Dim: `hsl(258 15% 52%)`
- Fonts: Unbounded (display), Inter (body), JetBrains Mono (mono)

## SHADOW v3.8 backend wiring (2026-04-22)
All 8 SHADOW pages now use real PostgreSQL via `/api/*` endpoints:
- `monitor` → `/api/keywords` (CRUD, 5s polling)
- `autoreplies` → `/api/autoreplies` (CRUD, 5s polling)
- `forwarding` → `/api/forwarding` (CRUD, 5s polling)
- `mirrors` → `/api/mirrors` (auto-generated access keys)
- `support` → `/api/support` (tickets with replies)
- `ocr` → `/api/ocr/recognize` (multipart → Python tesseract ukr+eng)
- `voice` → `/api/voice/transcribe` (multipart → Python faster-whisper tiny)
- `logs` → `/api/logs?eventType=` (filters: all/media/edited/deleted)

Bot side: `telegram-bot/shadow_handlers.py` registers `events.NewMessage`, `events.MessageEdited`, `events.MessageDeleted` — each event POSTs to Node API for log + checks active keywords/forward filters and upserts contact profile. FastAPI sub-router on :8001 hosts `/ocr/recognize` and `/voice/transcribe`.

Direct fetch helper: `artifacts/tg-dashboard/src/lib/shadow-api.ts` (no codegen for these endpoints — free tier optimization).

## Update — Stage 1 critical fixes + Stage 2 userbot menu (Apr 23, 2026)

### Stage 1 — critical fixes done
- **TTL cache** for `_fetch_keywords/autoreplies/forward_filters` in `telegram-bot/cache.py` (30 s default; tunable via `SHADOW_CACHE_TTL` env). Eliminates ~3 HTTP GETs per inbound message.
- **`hits` counter actually increments**: new endpoints `POST /api/{keywords|autoreplies|forwarding}/:id/hit` use `sql\`col + 1\``. Bot fires `_post_hit()` as a background task on every match.
- **Scheduler restore**: on startup, bot pulls active campaigns from `/api/campaigns` and re-adds APScheduler jobs with `misfire_grace_time=3600`. No external jobstore dep needed.
- **Encryption helper** `telegram-bot/crypto_utils.py` (Fernet) ready for any future sensitive field; falls back to deterministic dev key derived from `TELEGRAM_API_HASH`.
- **Session file** `telegram-bot/session/user_session.session` chmod 600.

### Stage 2 — userbot text menu (variant Б)
- New module `telegram-bot/bot_menu.py` registered in `Saved Messages`.
- Inline keyboards in **userbots are not supported by Telegram MTProto** — only BotFather bots can do callback_query. Implemented as text commands instead.
- Commands available by sending in Saved Messages:
  - `/menu`, `/help`, `/stats`
  - `/keywords`, `/add_kw <word>`, `/del_kw <id>`
  - `/autoreplies`, `/add_ar <trigger>|<reply>`, `/del_ar <id>`
  - `/forwarding`, `/add_fw <src>|<dst>[|<keyword>]`, `/del_fw <id>`
  - `/mirrors`, `/logs [n]`, `/clear_logs`
  - `/support <subj>|<msg>`
- Cache invalidation hooks: every add/delete command calls `cache.invalidate(<key>)`.

### Still pending (Stages 3–4)
- E012 cancel-limit counter
- "Last seen long ago" cron + notification
- Photo self-destruct save
- CSV export button on logs page
- Spawn isolated Telethon sub-client per mirror
- pytest suite (`test_broadcast.py`, `test_monitor.py`, `test_helpers.py`)
- Optional Stage 2 variant А: separate BotFather bot for inline keyboards

## Update — Stage 3 features (Apr 23, 2026)

### Done
- **CSV export of logs** — new "CSV" button in `logs.tsx` exports current selection (BOM-prefixed UTF-8, RFC 4180 escaping).
- **"Last seen >30 days" cron** — `check_inactive_contacts()` runs hourly; sends bundled (max 5) notification to Saved Messages, marks profiles with `inactive_notified` flag in `notes` to avoid spam.
- **Self-destruct media save** — in `shadow_handlers.on_new_message` we detect `msg.media.ttl_seconds`, immediately download the photo to `telegram-bot/media/` and store the path in `messageLogs.mediaPath`.
- **E012 cancel counter** — new table `cancel_counters (user_key, count, window_start, blocked_until)`. Endpoints:
  - `GET  /api/cancel/:userKey/check`
  - `POST /api/cancel/:userKey/inc`  → returns `{blocked, count, limit, message}` with E012 text when limit (10/24h) reached; auto-blocks for 1h.
  - `POST /api/cancel/:userKey/reset`
- **Mirror credentials storage** — `mirrors` table now has `apiId` (int), `apiHashEnc` (Fernet ciphertext from `crypto_utils.py`), `sessionString` (StringSession), `status` (`idle | configured | running | error`). `POST /api/mirrors` accepts `apiId/apiHashEnc`; new `PATCH /api/mirrors/:id` for updates.

### Known limitation
Spawning a real isolated Telethon sub-client per mirror requires phone+code+2FA verification flow, which has no UI yet. Credentials are persisted (encrypted) and ready — the actual `MirrorClient` runtime can be added once the dashboard provides the auth UI.

## Update — Stage 4 tests (Apr 23, 2026)

### Test suite added
- `telegram-bot/tests/test_helpers.py` — TTL cache (concurrency, expiry, invalidate) + Fernet roundtrip.
- `telegram-bot/tests/test_monitor.py` — `_fetch_*` HTTP fetching with mocked `httpx`, `_post_hit` fire-and-forget, cache deduplication.
- `telegram-bot/tests/test_broadcast.py` — schedule map for campaigns, bot_menu regex command parsing, inactive-contacts filter.
- `telegram-bot/pytest.ini` — asyncio_mode=auto.

Run: `cd telegram-bot && python -m pytest -v` → **28/28 passed in ~3.5s**.

### Why these tests
These cover the stable, deterministic units. End-to-end Telethon event tests require a live Telegram session and are out of scope; instead, all HTTP contracts and pure logic are mocked and verified.
