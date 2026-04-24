"""Simple async TTL cache to reduce HTTP load on Node API."""
import time
import asyncio
from typing import Any, Awaitable, Callable

_store: dict[str, tuple[float, Any]] = {}
_locks: dict[str, asyncio.Lock] = {}


def _lock(key: str) -> asyncio.Lock:
    if key not in _locks:
        _locks[key] = asyncio.Lock()
    return _locks[key]


async def cached(key: str, ttl: float, loader: Callable[[], Awaitable[Any]]) -> Any:
    """Return cached value or call loader() and cache result for ttl seconds."""
    now = time.time()
    hit = _store.get(key)
    if hit and hit[0] > now:
        return hit[1]
    async with _lock(key):
        # Re-check after acquiring lock (another coroutine may have refreshed).
        hit = _store.get(key)
        if hit and hit[0] > now:
            return hit[1]
        value = await loader()
        _store[key] = (now + ttl, value)
        return value


def invalidate(key: str | None = None) -> None:
    if key is None:
        _store.clear()
    else:
        _store.pop(key, None)
