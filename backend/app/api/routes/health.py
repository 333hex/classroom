"""Health check route."""
from __future__ import annotations

from fastapi import APIRouter

from app.db.database import check_db_connection
from app.schemas.note import HealthResponse
from app.storage.supabase_storage import check_storage_connection

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    db_ok = check_db_connection()
    storage_ok = await check_storage_connection()
    return HealthResponse(
        status="ok" if (db_ok and storage_ok) else "degraded",
        database=db_ok,
        storage=storage_ok,
    )
