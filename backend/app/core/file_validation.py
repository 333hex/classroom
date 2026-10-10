"""File validation utilities for uploaded notes."""
from __future__ import annotations

import io
import mimetypes
import os
import re
import struct
from typing import Optional

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.note import ResourceType

FILE_BASED_TYPES = {ResourceType.PDF, ResourceType.DOC, ResourceType.DOCX, ResourceType.IMAGE}

# ─── Allowed extensions and MIME types per resource type ─────────────────────
ALLOWED: dict[ResourceType, dict] = {
    ResourceType.PDF: {
        "extensions": {".pdf"},
        "mimes": {"application/pdf"},
        "magic": b"%PDF",
    },
    ResourceType.DOC: {
        "extensions": {".doc"},
        "mimes": {"application/msword"},
        "magic": b"\xd0\xcf\x11\xe0",  # OLE2 compound file
    },
    ResourceType.DOCX: {
        "extensions": {".docx"},
        "mimes": {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        },
        "magic": b"PK\x03\x04",  # ZIP (OOXML)
    },
    ResourceType.IMAGE: {
        "extensions": {".jpg", ".jpeg", ".png"},
        "mimes": {"image/jpeg", "image/png"},
        "magic": None,  # checked separately
    },
}

IMAGE_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
}

SAFE_FILENAME_RE = re.compile(r"[^a-zA-Z0-9._\-]")
MAX_FILENAME_LEN = 200


class FileValidationError(ValueError):
    pass


def sanitize_filename(filename: str) -> str:
    """Return a safe, shortened filename."""
    base, ext = os.path.splitext(filename)
    base = SAFE_FILENAME_RE.sub("_", base)
    ext = ext.lower()
    safe = f"{base[:MAX_FILENAME_LEN - len(ext)]}{ext}"
    return safe or "upload"


def _check_image_magic(header: bytes) -> Optional[str]:
    for magic, mime in IMAGE_MAGIC_BYTES.items():
        if header[: len(magic)] == magic:
            return mime
    return None


async def validate_uploaded_file(
    file: UploadFile,
    resource_type: ResourceType,
) -> tuple[bytes, str, str]:
    """
    Validate an uploaded file for a given resource type.

    Returns (content_bytes, safe_filename, detected_mime).
    Raises FileValidationError on any failure.
    """
    settings = get_settings()

    if resource_type not in ALLOWED:
        raise FileValidationError(
            f"Resource type {resource_type!r} does not accept file uploads."
        )

    rules = ALLOWED[resource_type]

    # ── Extension check ───────────────────────────────────────────────────────
    original_name = file.filename or "upload"
    _, ext = os.path.splitext(original_name.lower())
    if ext not in rules["extensions"]:
        raise FileValidationError(
            f"File extension '{ext}' not allowed for resource type '{resource_type}'. "
            f"Allowed: {', '.join(sorted(rules['extensions']))}"
        )

    # ── Read content ──────────────────────────────────────────────────────────
    content = await file.read()
    size = len(content)

    if size == 0:
        raise FileValidationError("Uploaded file is empty.")

    if size > settings.max_upload_size_bytes:
        raise FileValidationError(
            f"File size {size / (1024*1024):.1f} MB exceeds maximum "
            f"{settings.max_upload_size_mb} MB."
        )

    # ── Magic bytes / content validation ─────────────────────────────────────
    header = content[:8]

    if resource_type == ResourceType.IMAGE:
        detected_mime = _check_image_magic(header)
        if not detected_mime:
            raise FileValidationError("File does not appear to be a valid image.")
    else:
        magic = rules["magic"]
        if magic and not content.startswith(magic):
            raise FileValidationError(
                f"File content does not match expected format for '{resource_type}'."
            )
        detected_mime = file.content_type or mimetypes.guess_type(original_name)[0] or "application/octet-stream"
        # Validate the MIME type
        if detected_mime not in rules["mimes"]:
            # Use a safe fallback rather than trusting client
            detected_mime = next(iter(rules["mimes"]))

    safe_name = sanitize_filename(original_name)

    logger.info(
        "File validated",
        filename=safe_name,
        size_bytes=size,
        mime=detected_mime,
        resource_type=resource_type,
    )

    return content, safe_name, detected_mime
