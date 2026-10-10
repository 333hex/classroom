"""Business logic service for Note operations."""
from __future__ import annotations

import math
import uuid
from datetime import date
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.file_validation import (
    FILE_BASED_TYPES,
    FileValidationError,
    validate_uploaded_file,
)
from app.core.logging import get_logger
from app.core.security import generate_deletion_token, hash_deletion_token, verify_deletion_token
from app.models.note import ResourceType
from app.repositories.note_repository import NoteRepository
from app.schemas.note import (
    NoteCreate,
    NoteCreateResponse,
    NoteListResponse,
    NoteResponse,
)
from app.storage.supabase_storage import (
    build_storage_path,
    delete_file,
    generate_signed_url,
    upload_file,
)

logger = get_logger(__name__)


class NoteNotFoundError(Exception):
    pass


class InvalidDeletionTokenError(Exception):
    pass


class NoteService:
    def __init__(self, db: Session) -> None:
        self.repo = NoteRepository(db)
        self.db = db

    # ─── Upload ───────────────────────────────────────────────────────────────
    async def create_note(
        self,
        data: NoteCreate,
        file: Optional[UploadFile] = None,
    ) -> NoteCreateResponse:
        storage_path: Optional[str] = None
        safe_filename: Optional[str] = None
        mime_type: Optional[str] = None
        file_size: Optional[int] = None
        file_content: Optional[bytes] = None

        # ── File validation ───────────────────────────────────────────────
        if data.resource_type in FILE_BASED_TYPES:
            if file is None:
                raise FileValidationError(
                    "A file is required for this resource type."
                )
            file_content, safe_filename, mime_type = await validate_uploaded_file(
                file, data.resource_type
            )
            file_size = len(file_content)
            storage_path = build_storage_path(data.resource_type.value, safe_filename)

        # ── Generate deletion credential ──────────────────────────────────
        raw_token = generate_deletion_token()
        token_hash = hash_deletion_token(raw_token)

        # ── Database write ────────────────────────────────────────────────
        note = self.repo.create(
            data=data,
            deletion_token_hash=token_hash,
            storage_path=storage_path,
            original_filename=safe_filename,
            mime_type=mime_type,
            file_size=file_size,
        )

        # ── Storage upload (after DB, before commit) ──────────────────────
        if file_content and storage_path and mime_type:
            try:
                await upload_file(file_content, storage_path, mime_type)
            except RuntimeError as exc:
                # Roll back DB insertion if storage fails
                self.db.rollback()
                raise RuntimeError(str(exc)) from exc

        self.db.commit()
        self.db.refresh(note)

        logger.info("Note created", note_id=str(note.id), resource_type=data.resource_type)

        return NoteCreateResponse(
            note=NoteResponse.model_validate(note),
            deletion_token=raw_token,
        )

    # ─── List / Search ────────────────────────────────────────────────────────
    def list_notes(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        subject: Optional[str] = None,
        resource_type: Optional[ResourceType] = None,
        unit_number: Optional[int] = None,
        class_date: Optional[date] = None,
        sort: str = "newest",
    ) -> NoteListResponse:
        page_size = min(max(page_size, 1), 100)
        page = max(page, 1)

        notes, total = self.repo.list_notes(
            page=page,
            page_size=page_size,
            search=search,
            subject=subject,
            resource_type=resource_type,
            unit_number=unit_number,
            class_date=class_date,
            sort=sort,
        )

        return NoteListResponse(
            items=[NoteResponse.model_validate(n) for n in notes],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total else 0,
        )

    # ─── Detail ───────────────────────────────────────────────────────────────
    def get_note(self, note_id: uuid.UUID) -> NoteResponse:
        note = self.repo.get_by_id(note_id)
        if not note:
            raise NoteNotFoundError(f"Note {note_id} not found")
        return NoteResponse.model_validate(note)

    # ─── Download ─────────────────────────────────────────────────────────────
    def get_download_url(self, note_id: uuid.UUID) -> str:
        note = self.repo.get_by_id(note_id)
        if not note:
            raise NoteNotFoundError(f"Note {note_id} not found")
        if not note.storage_path:
            raise ValueError("This note does not have a downloadable file.")
        return generate_signed_url(note.storage_path)

    # ─── Delete ───────────────────────────────────────────────────────────────
    async def delete_note(self, note_id: uuid.UUID, deletion_token: str) -> None:
        note = self.repo.get_by_id(note_id)
        if not note:
            raise NoteNotFoundError(f"Note {note_id} not found")

        if not verify_deletion_token(deletion_token, note.deletion_token_hash):
            raise InvalidDeletionTokenError("Invalid deletion credential.")

        storage_path = note.storage_path

        # Delete DB record first
        self.repo.delete(note)
        self.db.commit()

        # Delete storage file (best-effort, does not un-delete DB record)
        if storage_path:
            try:
                await delete_file(storage_path)
            except RuntimeError as exc:
                logger.error(
                    "Storage cleanup failed after DB deletion",
                    note_id=str(note_id),
                    storage_path=storage_path,
                    error=str(exc),
                )
                # File orphan logged — can be cleaned up manually or via cron

        logger.info("Note deleted", note_id=str(note_id))

    # ─── Subjects ─────────────────────────────────────────────────────────────
    def get_subjects(self) -> list[str]:
        return self.repo.get_distinct_subjects()

    def get_stats(self) -> dict:
        return self.repo.get_stats()
