"""Notes API routes."""
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.file_validation import FileValidationError
from app.db.database import get_db
from app.models.note import ResourceType
from app.schemas.note import (
    NoteCreate,
    NoteCreateResponse,
    NoteDeleteRequest,
    NoteListResponse,
    NoteResponse,
    SubjectsResponse,
)
from app.services.note_service import (
    InvalidDeletionTokenError,
    NoteNotFoundError,
    NoteService,
)

router = APIRouter(tags=["notes"])
limiter = Limiter(key_func=get_remote_address)
settings = get_settings()


def _service(db: Session = Depends(get_db)) -> NoteService:
    return NoteService(db)


# ─── List notes ───────────────────────────────────────────────────────────────
@router.get("/notes", response_model=NoteListResponse)
async def list_notes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=200),
    subject: Optional[str] = Query(None, max_length=100),
    resource_type: Optional[ResourceType] = Query(None),
    unit_number: Optional[int] = Query(None, ge=1, le=999),
    class_date: Optional[date] = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    service: NoteService = Depends(_service),
) -> NoteListResponse:
    return service.list_notes(
        page=page,
        page_size=page_size,
        search=search,
        subject=subject,
        resource_type=resource_type,
        unit_number=unit_number,
        class_date=class_date,
        sort=sort,
    )


# ─── Upload note ──────────────────────────────────────────────────────────────
@router.post(
    "/notes",
    response_model=NoteCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.rate_limit_upload)
async def create_note(
    request: Request,
    title: str = Form(..., min_length=2, max_length=255),
    subject: str = Form(..., min_length=1, max_length=100),
    resource_type: ResourceType = Form(...),
    description: Optional[str] = Form(None),
    unit_number: Optional[int] = Form(None),
    topic: Optional[str] = Form(None),
    class_date: Optional[date] = Form(None),
    typed_content: Optional[str] = Form(None),
    external_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    service: NoteService = Depends(_service),
) -> NoteCreateResponse:
    try:
        note_data = NoteCreate(
            title=title,
            description=description,
            subject=subject,
            unit_number=unit_number,
            topic=topic,
            class_date=class_date,
            resource_type=resource_type,
            typed_content=typed_content,
            external_url=external_url,
        )
        return await service.create_note(data=note_data, file=file)
    except FileValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))


# ─── Get single note ──────────────────────────────────────────────────────────
@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: uuid.UUID,
    service: NoteService = Depends(_service),
) -> NoteResponse:
    try:
        return service.get_note(note_id)
    except NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


# ─── Download ─────────────────────────────────────────────────────────────────
@router.get("/notes/{note_id}/download")
@limiter.limit(settings.rate_limit_download)
async def download_note(
    request: Request,
    note_id: uuid.UUID,
    service: NoteService = Depends(_service),
):
    try:
        signed_url = service.get_download_url(note_id)
    except NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    from fastapi.responses import JSONResponse
    return JSONResponse({"download_url": signed_url})


# ─── Delete note ──────────────────────────────────────────────────────────────
@router.post("/notes/{note_id}/delete", status_code=status.HTTP_200_OK)
@limiter.limit(settings.rate_limit_delete)
async def delete_note(
    request: Request,
    note_id: uuid.UUID,
    body: NoteDeleteRequest,
    service: NoteService = Depends(_service),
):
    try:
        await service.delete_note(note_id, body.deletion_token)
    except NoteNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    except InvalidDeletionTokenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid deletion credential.",
        )
    return {"message": "Note deleted successfully."}


# ─── Subjects ─────────────────────────────────────────────────────────────────
@router.get("/subjects", response_model=SubjectsResponse)
async def get_subjects(service: NoteService = Depends(_service)) -> SubjectsResponse:
    subjects = service.get_subjects()
    return SubjectsResponse(subjects=subjects, total=len(subjects))


# ─── Stats ────────────────────────────────────────────────────────────────────
@router.get("/stats")
async def get_stats(service: NoteService = Depends(_service)):
    return service.get_stats()
