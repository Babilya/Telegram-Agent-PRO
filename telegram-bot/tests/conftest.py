import os
import sys
import pytest

# Ensure bot package is importable.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Stub minimal env so modules import without real Telegram creds.
os.environ.setdefault("TELEGRAM_API_ID", "1")
os.environ.setdefault("TELEGRAM_API_HASH", "test_hash")
os.environ.setdefault("NODE_API_URL", "http://localhost:8080")


@pytest.fixture
def anyio_backend():
    return "asyncio"
