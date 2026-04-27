#!/bin/bash
# Post-merge hook для обновления зависимостей после merge

set -e

echo "🔄 Updating dependencies after merge..."

pnpm install
echo "✓ Node.js deps updated"

if [ -f "pyproject.toml" ]; then
    pip install -e . 2>/dev/null || true
    echo "✓ Python deps updated"
fi

echo "✓ Post-merge complete"
