"""SQLAlchemy ORM model for the notes table."""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ResourceType(str, enum.Enum):
    PDF = "pdf"
    DOC = "doc"
    DOCX = "docx"
    IMAGE = "image"
    TYPED = "typed"
    VIDEO_LINK = "video_link"
    WEBSITE_LINK = "website_link"


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    # Core fields
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    unit_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    topic: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    class_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Resource type
    resource_type: Mapped[ResourceType] = mapped_column(
        Enum(ResourceType, name="resource_type_enum"),
        nullable=False,
        index=True,
    )

    # Content variants (at least one must be non-null — enforced by check constraint)
    typed_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # bytes

    # Security
    deletion_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        # At least one content source must be present
        CheckConstraint(
            "(typed_content IS NOT NULL)"
            " OR (external_url IS NOT NULL)"
            " OR (storage_path IS NOT NULL)",
            name="ck_notes_has_content",
        ),
        # External URLs must start with https://
        CheckConstraint(
            "(external_url IS NULL) OR (external_url LIKE 'https://%')",
            name="ck_notes_external_url_scheme",
        ),
        # Composite indexes for common filter patterns
        Index("ix_notes_subject_resource_type", "subject", "resource_type"),
        Index("ix_notes_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Note id={self.id} title={self.title!r}>"
