"""Data access layer for Note operations."""
from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.note import Note, ResourceType
from app.schemas.note import NoteCreate


class NoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ─── Create ───────────────────────────────────────────────────────────────
    def create(
        self,
        data: NoteCreate,
        deletion_token_hash: str,
        storage_path: Optional[str] = None,
        original_filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        file_size: Optional[int] = None,
    ) -> Note:
        note = Note(
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            subject=data.subject.strip(),
            unit_number=data.unit_number,
            topic=data.topic.strip() if data.topic else None,
            class_date=data.class_date,
            resource_type=data.resource_type,
            typed_content=data.typed_content,
            external_url=data.external_url,
            storage_path=storage_path,
            original_filename=original_filename,
            mime_type=mime_type,
            file_size=file_size,
            deletion_token_hash=deletion_token_hash,
        )
        self.db.add(note)
        self.db.flush()  # get the id without committing
        return note

    # ─── Read ─────────────────────────────────────────────────────────────────
    def get_by_id(self, note_id: uuid.UUID) -> Optional[Note]:
        stmt = select(Note).where(Note.id == note_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_notes(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        subject: Optional[str] = None,
        resource_type: Optional[ResourceType] = None,
        unit_number: Optional[int] = None,
        class_date: Optional[date] = None,
        sort: str = "newest",
    ) -> tuple[list[Note], int]:
        stmt = select(Note)

        # ── Search ─────────────────────────────────────────────────────────
        if search:
            q = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Note.title.ilike(q),
                    Note.description.ilike(q),
                    Note.subject.ilike(q),
                    Note.topic.ilike(q),
                )
            )

        # ── Filters ────────────────────────────────────────────────────────
        if subject:
            stmt = stmt.where(Note.subject.ilike(subject))
        if resource_type:
            stmt = stmt.where(Note.resource_type == resource_type)
        if unit_number is not None:
            stmt = stmt.where(Note.unit_number == unit_number)
        if class_date:
            stmt = stmt.where(Note.class_date == class_date)

        # ── Count ──────────────────────────────────────────────────────────
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = self.db.execute(count_stmt).scalar_one()

        # ── Sort ───────────────────────────────────────────────────────────
        if sort == "oldest":
            stmt = stmt.order_by(asc(Note.created_at))
        else:
            stmt = stmt.order_by(desc(Note.created_at))

        # ── Paginate ───────────────────────────────────────────────────────
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        notes = list(self.db.execute(stmt).scalars().all())
        return notes, total

    def get_distinct_subjects(self) -> list[str]:
        stmt = select(Note.subject).distinct().order_by(Note.subject)
        return list(self.db.execute(stmt).scalars().all())

    def get_stats(self) -> dict:
        total = self.db.execute(select(func.count(Note.id))).scalar_one()
        subject_count = self.db.execute(
            select(func.count(func.distinct(Note.subject)))
        ).scalar_one()
        return {"total_notes": total, "total_subjects": subject_count}

    # ─── Delete ───────────────────────────────────────────────────────────────
    def delete(self, note: Note) -> None:
        self.db.delete(note)
        self.db.flush()
