"""Pydantic schemas for Note API requests and responses."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.models.note import ResourceType

# ─── File-based resource types ────────────────────────────────────────────────
FILE_BASED_TYPES = {ResourceType.PDF, ResourceType.DOC, ResourceType.DOCX, ResourceType.IMAGE}
LINK_BASED_TYPES = {ResourceType.VIDEO_LINK, ResourceType.WEBSITE_LINK}
TEXT_BASED_TYPES = {ResourceType.TYPED}


class NoteCreate(BaseModel):
    """Payload to create a new note (file content handled separately via multipart)."""

    title: str = Field(..., min_length=2, max_length=255, description="Note title")
    description: Optional[str] = Field(None, max_length=2000)
    subject: str = Field(..., min_length=1, max_length=100)
    unit_number: Optional[int] = Field(None, ge=1, le=999)
    topic: Optional[str] = Field(None, max_length=200)
    class_date: Optional[date] = None
    resource_type: ResourceType

    # Content variants (conditional requirements validated below)
    typed_content: Optional[str] = Field(None, max_length=50000)
    external_url: Optional[str] = Field(None, max_length=2048)

    @field_validator("external_url")
    @classmethod
    def validate_external_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith("https://"):
            raise ValueError("External URL must use HTTPS scheme")
        # Reject dangerous schemes embedded in the URL
        lower = v.lower()
        for bad in ["javascript:", "data:", "file:", "ftp://", "vbscript:"]:
            if bad in lower:
                raise ValueError(f"URL contains disallowed scheme: {bad}")
        return v

    @model_validator(mode="after")
    def validate_content_present(self) -> "NoteCreate":
        rt = self.resource_type
        if rt in LINK_BASED_TYPES:
            if not self.external_url:
                raise ValueError("external_url is required for link-based resource types")
        elif rt in TEXT_BASED_TYPES:
            if not self.typed_content:
                raise ValueError("typed_content is required for typed notes")
        # For file-based types, the file is validated separately via multipart
        return self


class NoteResponse(BaseModel):
    """Public note data returned in list and detail endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str]
    subject: str
    unit_number: Optional[int]
    topic: Optional[str]
    class_date: Optional[date]
    resource_type: ResourceType
    typed_content: Optional[str] = None
    external_url: Optional[str] = None
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    # storage_path intentionally excluded from public response
    created_at: datetime
    updated_at: datetime


class NoteCreateResponse(BaseModel):
    """Response after successful upload, includes one-time deletion token."""

    model_config = ConfigDict(from_attributes=True)

    note: NoteResponse
    deletion_token: str = Field(
        ...,
        description="SAVE THIS. One-time private token to delete your note. Not stored or recoverable.",
    )


class NoteListResponse(BaseModel):
    """Paginated list of notes."""

    items: list[NoteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class NoteDeleteRequest(BaseModel):
    """Body of a deletion request."""

    deletion_token: str = Field(..., min_length=32, max_length=128)


class SubjectsResponse(BaseModel):
    """Distinct subjects with note counts."""

    subjects: list[str]
    total: int


class HealthResponse(BaseModel):
    status: str
    database: bool
    storage: bool
    version: str = "1.0.0"
