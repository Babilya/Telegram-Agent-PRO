"""Live integration smoke test against the Express API server.

Skipped automatically if the API is not reachable on http://localhost:8080.
Verifies the full SHADOW data plane (CRUD + counters + system endpoints) end
to end on the actual running stack.
"""
from __future__ import annotations

import os
import socket

import httpx
import pytest

API = os.environ.get("NODE_API_URL", "http://localhost:8080")


def _api_up() -> bool:
    host, port = "localhost", 8080
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(not _api_up(), reason="api-server not running")


@pytest.fixture(scope="module")
def http():
    with httpx.Client(base_url=API, timeout=10) as c:
        yield c


def test_health_ok(http):
    r = http.get("/api/healthz")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_keywords_full_lifecycle(http):
    payload = {"word": "_int_test_kw"}
    r = http.post("/api/keywords", json=payload)
    assert r.status_code == 200, r.text
    kw_id = r.json()["keyword"]["id"]

    try:
        # increment hit counter
        for _ in range(3):
            assert http.post(f"/api/keywords/{kw_id}/hit").status_code == 200

        listing = http.get("/api/keywords").json()["keywords"]
        match = [k for k in listing if k["id"] == kw_id]
        assert match and match[0]["hits"] >= 3, listing
    finally:
        assert http.delete(f"/api/keywords/{kw_id}").status_code == 200


def test_autoreplies_and_forwarding_crud(http):
    a = http.post("/api/autoreplies", json={"trigger": "_t_int", "reply": "ok"}).json()
    f = http.post("/api/forwarding", json={"sourceChat": "@a", "destChat": "@b"}).json()
    try:
        assert a["success"] and f["success"]
        assert any(x["id"] == a["autoreply"]["id"] for x in http.get("/api/autoreplies").json()["autoreplies"])
        assert any(x["id"] == f["filter"]["id"] for x in http.get("/api/forwarding").json()["filters"])
    finally:
        http.delete(f"/api/autoreplies/{a['autoreply']['id']}")
        http.delete(f"/api/forwarding/{f['filter']['id']}")


def test_support_ticket_persisted(http):
    r = http.post("/api/support", json={"subject": "_int", "message": "smoke"}).json()
    tid = r["ticket"]["id"]
    try:
        assert any(t["id"] == tid for t in http.get("/api/support").json()["tickets"])
    finally:
        http.delete(f"/api/support/{tid}")


def test_system_tests_endpoint_serves_cached_run(http):
    r = http.get("/api/system/tests")
    assert r.status_code == 200
    body = r.json()
    assert "lastRun" in body
    assert "running" in body
