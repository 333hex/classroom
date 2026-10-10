"""Cryptographic security helpers."""
from __future__ import annotations

import hashlib
import hmac
import secrets


def generate_deletion_token() -> str:
    """Return a 64-character URL-safe cryptographically secure token."""
    return secrets.token_urlsafe(48)


def hash_deletion_token(token: str) -> str:
    """Return a SHA-256 hex digest of *token* for safe storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_deletion_token(plain_token: str, stored_hash: str) -> bool:
    """Constant-time comparison of a plain token against a stored SHA-256 hash."""
    computed = hash_deletion_token(plain_token)
    return hmac.compare_digest(computed, stored_hash)
