"""Tests for cache, crypto, and pure helper logic."""
import asyncio
import pytest

from cache import cached, invalidate
from crypto_utils import encrypt, decrypt


# ─── TTL cache ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cache_returns_cached_value_within_ttl():
    invalidate()
    calls = {"n": 0}

    async def loader():
        calls["n"] += 1
        return ["a", "b"]

    r1 = await cached("k1", ttl=10, loader=loader)
    r2 = await cached("k1", ttl=10, loader=loader)
    assert r1 == r2 == ["a", "b"]
    assert calls["n"] == 1, "loader must be called only once within TTL"


@pytest.mark.asyncio
async def test_cache_expires_after_ttl():
    invalidate()
    calls = {"n": 0}

    async def loader():
        calls["n"] += 1
        return calls["n"]

    await cached("k2", ttl=0.05, loader=loader)
    await asyncio.sleep(0.08)
    r2 = await cached("k2", ttl=0.05, loader=loader)
    assert r2 == 2
    assert calls["n"] == 2


@pytest.mark.asyncio
async def test_cache_invalidate_specific_key():
    invalidate()
    n = {"v": 0}

    async def loader():
        n["v"] += 1
        return n["v"]

    await cached("a", ttl=60, loader=loader)
    await cached("b", ttl=60, loader=loader)
    invalidate("a")
    await cached("a", ttl=60, loader=loader)  # should reload
    await cached("b", ttl=60, loader=loader)  # should still be cached
    assert n["v"] == 3


@pytest.mark.asyncio
async def test_cache_concurrent_loaders_run_once():
    """Two concurrent calls for the same missing key should run loader once."""
    invalidate()
    calls = {"n": 0}

    async def loader():
        await asyncio.sleep(0.02)
        calls["n"] += 1
        return "value"

    r1, r2 = await asyncio.gather(
        cached("dup", ttl=60, loader=loader),
        cached("dup", ttl=60, loader=loader),
    )
    assert r1 == r2 == "value"
    assert calls["n"] == 1


# ─── Fernet encryption ────────────────────────────────────────────────────────

def test_encrypt_decrypt_roundtrip():
    plain = "secret_api_hash_abc123"
    token = encrypt(plain)
    assert token != plain
    assert decrypt(token) == plain


def test_encrypt_none_returns_none():
    assert encrypt(None) is None
    assert encrypt("") is None
    assert decrypt(None) is None


def test_decrypt_garbage_returns_none():
    assert decrypt("not-a-valid-token") is None
