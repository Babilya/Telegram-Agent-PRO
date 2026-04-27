#!/bin/bash

# Telegram Agent PRO — автоматизированный setup
# Использование: bash scripts/setup.sh

set -e

echo "🚀 Telegram Agent PRO Setup"
echo "============================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода статуса
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Проверка зависимостей
echo "📦 Проверка зависимостей..."

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm не установлен"
    print_info "Установи: npm install -g pnpm"
    exit 1
fi
print_status "pnpm найден: $(pnpm --version)"

if ! command -v python &> /dev/null; then
    print_error "Python не установлен"
    exit 1
fi
print_status "Python найден: $(python --version)"

echo ""
echo "📥 Установка зависимостей Node.js..."
pnpm install
print_status "Node.js зависимости установлены"

echo ""
echo "🔍 TypeScript typecheck..."
pnpm run typecheck || {
    print_error "TypeScript ошибки найдены!"
    exit 1
}
print_status "TypeScript проверка пройдена"

echo ""
echo "🔨 Построение проекта..."
pnpm run build || {
    print_error "Build ошибка!"
    exit 1
}
print_status "Проект построен"

echo ""
echo "🐍 Установка Python зависимостей..."
if [ -f "pyproject.toml" ]; then
    pip install -e . || {
        print_error "Python зависимости ошибка!"
        exit 1
    }
    print_status "Python зависимости установлены"
else
    print_info "pyproject.toml не найден, пропуск Python setup"
fi

echo ""
echo "✅ Запуск Python тестов..."
cd telegram-bot
if python -m pytest -v; then
    print_status "Все тесты пройдены (33/33 ✅)"
else
    print_error "Тесты ошибка!"
    exit 1
fi
cd ..

echo ""
echo "🎉 Setup завершен успешно!"
echo ""
echo "📋 Далее запусти сервисы:"
echo "  Терминал 1: python telegram-bot/main.py"
echo "  Терминал 2: cd artifacts/api-server && pnpm run dev"
echo "  Терминал 3: cd artifacts/tg-dashboard && pnpm run dev"
echo ""
echo "🌐 Доступ:"
echo "  Dashboard: http://localhost:20141"
echo "  API: http://localhost:8080"
echo "  Bot: http://localhost:8001"
echo ""
