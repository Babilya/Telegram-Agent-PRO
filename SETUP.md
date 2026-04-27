# 🚀 Telegram Agent PRO — Setup Guide

## Быстрый старт (Replit)

### 1️⃣ Установить зависимости

```bash
pnpm install
```

### 2️⃣ Проверить TypeScript

```bash
pnpm run typecheck
```

**Ожидаемо:** Никаких ошибок

### 3️⃣ Построить проект

```bash
pnpm run build
```

**Ожидаемо:** Все пакеты собраны успешно

### 4️⃣ Запустить тесты Python

```bash
cd telegram-bot && python -m pytest -v
```

**Ожидаемо:** 33/33 tests passed ✅

---

## 🔧 Запуск сервисов

### Терминал 1: Python Bot Service (порт 8001)
```bash
python telegram-bot/main.py
```

### Терминал 2: Express API (порт 8080)
```bash
cd artifacts/api-server
pnpm run dev
```

### Терминал 3: React Dashboard (порт 20141)
```bash
cd artifacts/tg-dashboard
pnpm run dev
```

---

## 🔑 Переменные окружения (.env)

Создай файл `.env` в корне проекта:

```env
# Telegram API (https://my.telegram.org/apps)
TELEGRAM_API_ID=123456789
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890

# Опционально: для inline bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIJKLmnopQRSTuvwxyz

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shadow_agent

# Сервисы
NODE_API_URL=http://localhost:8080
NODE_API_ORIGIN=http://localhost:8080
PYTHON_BOT_PORT=8001

# Безопасность
INTERNAL_API_KEY=your-super-secret-key-here
SESSION_SECRET=your-session-secret-here

# Опционально: encryption для миррор-учетных данных
SHADOW_ENCRYPTION_KEY=optional-fernet-key
```

---

## 📋 Структура проекта

```
telegram-bot/          # Python Telethon bot
├── main.py            # FastAPI сервер
├── shadow_handlers.py # Event handlers
├── mirror_manager.py  # Для mirror-ботов
├── inline_bot.py      # Inline keyboard bot
└── tests/             # pytest suite (33 tests)

artifacts/
├── api-server/        # Express API (Node.js)
├── tg-dashboard/      # React UI
└── mockup-sandbox/

lib/
├── db/                # Drizzle ORM + schema
└── integrations/

scripts/               # Утилиты
```

---

## ✅ Проверка здоровья системы

Когда все сервисы запущены:

```bash
# API health
curl http://localhost:8080/api/healthz

# Python service health
curl http://localhost:8001/system/info

# Full system status
curl http://localhost:8080/api/system/health
```

---

## 🐛 Решение проблем

### pnpm: command not found
```bash
npm install -g pnpm
```

### Python module not found
```bash
cd telegram-bot
pip install -r ../pyproject.toml
# или если используется uv:
uv pip install
```

### Port already in use
```bash
# Найти процесс на порту 8080
lsof -i :8080
# Остановить его
kill -9 <PID>
```

### Database connection error
```bash
# Убедись, что PostgreSQL запущен
psql $DATABASE_URL

# Или инициализируй схему:
cd lib/db && pnpm run push
```

---

## 📚 Основные команды

```bash
# Typecheck
pnpm run typecheck

# Build все
pnpm run build

# Build конкретный пакет
pnpm --filter @workspace/api-server run build

# Тесты Python
cd telegram-bot && python -m pytest -v

# Тесты с покрытием
cd telegram-bot && python -m pytest -v --cov

# Регенерировать API hooks из OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Push DB схему
cd lib/db && pnpm run push
```

---

## 🎯 API Endpoints

### Auth (Python :8001)
- `GET /auth/status` — проверить авторизацию
- `POST /auth/send-code` — отправить код
- `POST /auth/verify-code` — подтвердить код
- `POST /auth/verify-password` — 2FA пароль
- `POST /auth/logout` — выход

### Groups (Express :8080)
- `GET /api/groups` — все группы
- `POST /api/groups` — добавить группу
- `POST /api/groups/join` — присоединиться
- `DELETE /api/groups/:id` — удалить

### Campaigns (Express :8080)
- `GET /api/campaigns` — все кампании
- `POST /api/campaigns` — создать
- `POST /api/campaigns/:id/start` — начать
- `POST /api/campaigns/:id/pause` — пауза

### System (Express :8080)
- `GET /api/system/health` — статус всей системы
- `GET /api/system/jobs` — APScheduler jobs

---

## 🔐 Безопасность

- ✅ Python сервис требует `X-API-Key` header
- ✅ CORS ограничен до `NODE_API_ORIGIN`
- ✅ Все ID валидируются через `parsedId()` helper
- ✅ Зашифрованные mirror credentials (Fernet)
- ✅ Rate limiting: 300 req/min per IP
- ✅ Session файлы: chmod 600

---

## 📞 Поддержка

Если что-то не работает:
1. Проверь консоль на ошибки
2. Убедись, что все сервисы запущены
3. Проверь переменные окружения
4. Посмотри логи: `telegram-bot/session/`

Готово! 🚀
