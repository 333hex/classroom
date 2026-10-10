"""Supabase Storage service for uploading and generating signed download URLs."""
from __future__ import annotations

import uuid

from supabase import Client, create_client

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: Client | None = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _client


def _bucket() -> str:
    return get_settings().supabase_storage_bucket


def build_storage_path(resource_type: str, safe_filename: str) -> str:
    """Build a deterministic but unique path for a file in the bucket."""
    uid = uuid.uuid4().hex
    return f"{resource_type}/{uid[:2]}/{uid[2:4]}/{uid}_{safe_filename}"


async def upload_file(
    content: bytes,
    storage_path: str,
    mime_type: str,
) -> str:
    """
    Upload *content* to the private Supabase Storage bucket.

    Returns the *storage_path* on success.
    Raises RuntimeError on failure.
    """
    client = get_supabase_client()
    bucket = _bucket()

    try:
        response = client.storage.from_(bucket).upload(
            path=storage_path,
            file=content,
            file_options={
                "content-type": mime_type,
                "upsert": "false",
            },
        )
        logger.info("File uploaded to storage", path=storage_path, size=len(content))
        return storage_path
    except Exception as exc:
        logger.error("Storage upload failed", path=storage_path, error=str(exc))
        raise RuntimeError(f"Failed to upload file to storage: {exc}") from exc


async def delete_file(storage_path: str) -> bool:
    """
    Delete a file from private storage.

    Returns True if deleted, False if not found (treated as success for idempotency).
    Raises RuntimeError on other failures.
    """
    client = get_supabase_client()
    bucket = _bucket()

    try:
        client.storage.from_(bucket).remove([storage_path])
        logger.info("File deleted from storage", path=storage_path)
        return True
    except Exception as exc:
        err = str(exc).lower()
        if "not found" in err or "does not exist" in err:
            logger.warning("File not found in storage (already deleted?)", path=storage_path)
            return False
        logger.error("Storage deletion failed", path=storage_path, error=str(exc))
        raise RuntimeError(f"Failed to delete file from storage: {exc}") from exc


def generate_signed_url(storage_path: str, ttl_seconds: int | None = None) -> str:
    """
    Return a short-lived signed download URL for *storage_path*.

    Raises RuntimeError if the file cannot be accessed.
    """
    client = get_supabase_client()
    bucket = _bucket()
    settings = get_settings()
    ttl = ttl_seconds or settings.signed_url_ttl_seconds

    try:
        result = client.storage.from_(bucket).create_signed_url(
            path=storage_path,
            expires_in=ttl,
        )
        url = result.get("signedURL") or result.get("signed_url") or result.get("data", {}).get("signedUrl")
        if not url:
            raise RuntimeError("Signed URL not present in response")
        logger.info("Signed URL generated", path=storage_path, ttl=ttl)
        return url
    except Exception as exc:
        logger.error("Failed to generate signed URL", path=storage_path, error=str(exc))
        raise RuntimeError(f"Could not generate download URL: {exc}") from exc


async def check_storage_connection() -> bool:
    """Return True if the storage bucket is accessible."""
    try:
        client = get_supabase_client()
        client.storage.from_(_bucket()).list(path="", options={"limit": 1})
        return True
    except Exception as exc:
        logger.error("Storage connection check failed", error=str(exc))
        return False
