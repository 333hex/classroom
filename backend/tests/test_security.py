"""Tests for security utilities."""
from __future__ import annotations

from app.core.security import generate_deletion_token, hash_deletion_token, verify_deletion_token


def test_token_is_64_chars_urlsafe():
    token = generate_deletion_token()
    assert len(token) >= 60
    assert all(c.isalnum() or c in "-_" for c in token)


def test_hash_is_sha256_hex():
    token = generate_deletion_token()
    h = hash_deletion_token(token)
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)


def test_verify_correct_token():
    token = generate_deletion_token()
    h = hash_deletion_token(token)
    assert verify_deletion_token(token, h) is True


def test_verify_wrong_token():
    token = generate_deletion_token()
    h = hash_deletion_token(token)
    assert verify_deletion_token("wrong-token", h) is False


def test_different_tokens_produce_different_hashes():
    t1 = generate_deletion_token()
    t2 = generate_deletion_token()
    assert hash_deletion_token(t1) != hash_deletion_token(t2)


def test_token_for_one_note_fails_another():
    """Token issued for one note cannot delete another (hashes differ)."""
    token_a = generate_deletion_token()
    hash_b = hash_deletion_token(generate_deletion_token())
    assert verify_deletion_token(token_a, hash_b) is False
