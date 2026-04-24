"""Tests for shadow_handlers fetch + hit-counter helpers (HTTP mocked)."""
import pytest
import respx
import httpx

import shadow_handlers as sh
from cache import invalidate


@pytest.mark.asyncio
@respx.mock
async def test_fetch_keywords_returns_list():
    invalidate()
    respx.get("http://localhost:8080/api/keywords").mock(
        return_value=httpx.Response(200, json={"keywords": [{"id": 1, "word": "spam", "enabled": True}]})
    )
    rows = await sh._fetch_keywords_uncached()
    assert rows == [{"id": 1, "word": "spam", "enabled": True}]


@pytest.mark.asyncio
@respx.mock
async def test_fetch_keywords_returns_empty_on_failure():
    invalidate()
    respx.get("http://localhost:8080/api/keywords").mock(side_effect=httpx.ConnectError("boom"))
    rows = await sh._fetch_keywords_uncached()
    assert rows == []


@pytest.mark.asyncio
@respx.mock
async def test_post_hit_calls_correct_endpoint():
    route = respx.post("http://localhost:8080/api/keywords/42/hit").mock(
        return_value=httpx.Response(200, json={"success": True})
    )
    await sh._post_hit("keywords", 42)
    assert route.called
    assert route.call_count == 1


@pytest.mark.asyncio
@respx.mock
async def test_post_hit_swallows_errors():
    """Hit counter must never raise — fire-and-forget."""
    respx.post("http://localhost:8080/api/keywords/99/hit").mock(
        side_effect=httpx.TimeoutException("timeout")
    )
    # Should not raise.
    await sh._post_hit("keywords", 99)


@pytest.mark.asyncio
@respx.mock
async def test_fetch_autoreplies_and_forwarding():
    invalidate()
    respx.get("http://localhost:8080/api/autoreplies").mock(
        return_value=httpx.Response(200, json={"autoreplies": [{"id": 1, "trigger": "hi"}]})
    )
    respx.get("http://localhost:8080/api/forwarding").mock(
        return_value=httpx.Response(200, json={"filters": [{"id": 1, "sourceChat": "x"}]})
    )
    ar = await sh._fetch_autoreplies_uncached()
    fw = await sh._fetch_forward_filters_uncached()
    assert ar[0]["trigger"] == "hi"
    assert fw[0]["sourceChat"] == "x"


@pytest.mark.asyncio
@respx.mock
async def test_cached_fetch_dedupes_calls():
    invalidate()
    route = respx.get("http://localhost:8080/api/keywords").mock(
        return_value=httpx.Response(200, json={"keywords": []})
    )
    sh.CACHE_TTL = 5
    await sh._fetch_keywords()
    await sh._fetch_keywords()
    await sh._fetch_keywords()
    assert route.call_count == 1
