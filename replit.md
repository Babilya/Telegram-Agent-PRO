# Telegram Group Manager

## Overview

Full-stack Telegram marketing tool: Python bot (Telethon) + Node.js API + React web dashboard. Allows searching Telegram groups, auto-joining channels, and running scheduled broadcast campaigns from a user Telegram account.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Python**: 3.11 (Telethon, FastAPI, APScheduler)
- **Package manager**: pnpm (Node), pip (Python)
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + TailwindCSS (dark, electric-green theme)
- **Build**: esbuild (CJS bundle)

## Services

| Service | Port | Description |
|---|---|---|
| React Dashboard | 20141 | Web UI for managing groups/campaigns |
| Express API | 8080 | REST API proxy + DB operations |
| Python Bot | 8001 | Telethon client: search, join, broadcast |

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `python telegram-bot/main.py` — run Python bot service

## Features

1. **Auth**: Telegram login via phone/code/2FA password (Telethon)
2. **Group Search**: Search by keyword, filter by type/min-max members
3. **Saved Groups**: Save, bulk-select, auto-join groups with delay
4. **Campaigns**: Create broadcast campaigns with schedule (hourly/2h/4h/8h/12h/daily/custom)
5. **Job History**: Full log of join and broadcast operations

## Environment Secrets Required

- `TELEGRAM_API_ID` — from https://my.telegram.org/apps
- `TELEGRAM_API_HASH` — from https://my.telegram.org/apps
- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `TELEGRAM_PHONE` — user phone number (+380...)
- `DATABASE_URL` — auto-provisioned PostgreSQL

## DB Schema

- `groups` — saved Telegram groups with status (saved/joined/pending/failed)
- `campaigns` — broadcast campaigns with schedule and stats
- `jobs` — job execution history
