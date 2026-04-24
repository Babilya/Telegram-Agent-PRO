"""Tests for broadcast scheduling logic and bot_menu command parsing."""
import re
import pytest


# ─── Schedule map (extracted from main.start_campaign) ─────────────────────────

SCHEDULE_MAP = {
    "once": None,
    "hourly": 1.0,
    "every2h": 2.0,
    "every4h": 4.0,
    "every8h": 8.0,
    "every12h": 12.0,
    "daily": 24.0,
}


@pytest.mark.parametrize("schedule,expected", [
    ("hourly", 1.0),
    ("every2h", 2.0),
    ("every4h", 4.0),
    ("every8h", 8.0),
    ("every12h", 12.0),
    ("daily", 24.0),
])
def test_schedule_map_returns_expected_hours(schedule, expected):
    assert SCHEDULE_MAP[schedule] == expected


def test_once_schedule_is_none():
    assert SCHEDULE_MAP["once"] is None


def test_unknown_schedule_falls_back():
    """Mirror real fallback: hours = SCHEDULE_MAP.get(s) or 1.0."""
    assert (SCHEDULE_MAP.get("xxx") or 1.0) == 1.0


# ─── Bot menu command patterns ─────────────────────────────────────────────────

PATTERNS = {
    "menu":    r"^/menu$",
    "add_kw":  r"^/add_kw\s+(.+)$",
    "del_kw":  r"^/del_kw\s+(\d+)$",
    "add_ar":  r"^/add_ar\s+(.+)$",
    "add_fw":  r"^/add_fw\s+(.+)$",
    "logs":    r"^/logs(?:\s+(\d+))?$",
    "support": r"^/support\s+(.+)$",
}


def test_menu_command_matches_exactly():
    assert re.match(PATTERNS["menu"], "/menu")
    assert not re.match(PATTERNS["menu"], "/menu extra")
    assert not re.match(PATTERNS["menu"], "/menus")


def test_add_kw_captures_word():
    m = re.match(PATTERNS["add_kw"], "/add_kw тест слово")
    assert m and m.group(1) == "тест слово"


def test_del_kw_only_accepts_digits():
    assert re.match(PATTERNS["del_kw"], "/del_kw 42")
    assert not re.match(PATTERNS["del_kw"], "/del_kw abc")


def test_logs_optional_argument():
    m = re.match(PATTERNS["logs"], "/logs")
    assert m and m.group(1) is None
    m = re.match(PATTERNS["logs"], "/logs 25")
    assert m and m.group(1) == "25"


def test_pipe_separated_payload_parses():
    raw = "тригер|відповідь з пробілами"
    trig, reply = raw.split("|", 1)
    assert trig == "тригер"
    assert reply == "відповідь з пробілами"


def test_forward_filter_payload_3_parts():
    raw = "src_chat|dest_chat|keyword"
    parts = [p.strip() for p in raw.split("|")]
    assert len(parts) == 3
    assert parts == ["src_chat", "dest_chat", "keyword"]


# ─── Inactive-contacts filtering logic ──────────────────────────────────────────

from datetime import datetime, timedelta


def _filter_stale(profiles, days=30):
    threshold = datetime.now() - timedelta(days=days)
    out = []
    for p in profiles:
        ls = p.get("lastSeen")
        if not ls:
            continue
        try:
            ts = datetime.fromisoformat(ls.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            continue
        if ts < threshold and (p.get("notes") or "").find("inactive_notified") < 0:
            out.append(p)
    return out


def test_inactive_filter_picks_old_only():
    old = (datetime.now() - timedelta(days=40)).isoformat()
    new = (datetime.now() - timedelta(days=2)).isoformat()
    profiles = [
        {"id": 1, "lastSeen": old},
        {"id": 2, "lastSeen": new},
        {"id": 3, "lastSeen": old, "notes": "inactive_notified flag"},
        {"id": 4, "lastSeen": None},
        {"id": 5},
    ]
    stale = _filter_stale(profiles)
    assert [p["id"] for p in stale] == [1]
