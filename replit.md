# Telegram Group Manager — GROUP AGENT

## Overview

Full-stack Telegram marketing tool: Python bot (Telethon) + Node.js API + React web dashboard.
Allows searching Telegram groups, auto-joining channels, running scheduled broadcast campaigns,
parsing group members, and saving contacts — all from a user Telegram account.

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
- join-status callback does UPDATE first, INSERT only if no existing record (avoids duplicate jobs)
- Contact filtering uses SQL WHERE clause (not in-memory Node.js)
- Parse timeout is 55s (below 60s proxy limit)
- Auth modal race condition fixed: single useEffect for step initialization (no setTimeout fallback)
- apiid/apihash UI steps removed — credentials must be set as env vars
- `window.confirm()` replaced with AlertDialog (works in iframe/proxy environments)
- Nested FormField with same name fixed with useWatch + direct form.setValue
- FloodWait retry: same group retried after sleep, not skipped
- Python uses lifespan event handlers (no DeprecationWarning)

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
- `GET /api/contacts?search=&sourceGroup=` — list saved contacts
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
