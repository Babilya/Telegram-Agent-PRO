"""Fernet symmetric encryption helper for sensitive fields."""
import os
import base64
import hashlib
import logging

logger = logging.getLogger("crypto")

_fernet = None


def _get_fernet():
    global _fernet
    if _fernet is not None:
        return _fernet
    try:
        from cryptography.fernet import Fernet
    except ImportError:
        logger.warning("cryptography not installed; encryption disabled")
        return None

    raw = os.environ.get("SHADOW_ENCRYPTION_KEY", "")
    if not raw:
        # Derive a deterministic dev key from API_HASH so dev still works.
        seed = os.environ.get("TELEGRAM_API_HASH", "shadow-dev-key")
        raw = base64.urlsafe_b64encode(hashlib.sha256(seed.encode()).digest()).decode()
    elif len(raw) < 44:
        raw = base64.urlsafe_b64encode(hashlib.sha256(raw.encode()).digest()).decode()

    try:
        _fernet = Fernet(raw.encode() if isinstance(raw, str) else raw)
    except Exception as e:
        logger.error(f"Invalid SHADOW_ENCRYPTION_KEY: {e}")
        _fernet = None
    return _fernet


def encrypt(plain: str | None) -> str | None:
    if plain is None or plain == "":
        return None
    f = _get_fernet()
    if f is None:
        return plain  # Fail open in dev rather than block
    return f.encrypt(plain.encode()).decode()


def decrypt(token: str | None) -> str | None:
    if token is None or token == "":
        return None
    f = _get_fernet()
    if f is None:
        return token
    try:
        return f.decrypt(token.encode()).decode()
    except Exception as e:
        logger.warning(f"decrypt failed: {e}")
        return None
