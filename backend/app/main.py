"""Class Connect FastAPI application factory."""
from __future__ import annotations

import sys

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import health, notes
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)

settings = get_settings()

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── Application ──────────────────────────────────────────────────────────────
fastapi_app = FastAPI(
    title="Class Connect API",
    description="Public educational notes-sharing platform API.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

fastapi_app.state.limiter = limiter
fastapi_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Request size limit middleware ────────────────────────────────────────────
@fastapi_app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        length = int(content_length)
        # Add 10% buffer for form overhead
        max_bytes = int(settings.max_upload_size_bytes * 1.1) + 1024
        if length > max_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": f"Request body too large. Maximum: {settings.max_upload_size_mb} MB"},
            )
    return await call_next(request)


# ─── Global error handler ─────────────────────────────────────────────────────
@fastapi_app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc, path=str(request.url))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ─── Routes ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

fastapi_app.include_router(health.router, prefix=API_PREFIX)
fastapi_app.include_router(notes.router, prefix=API_PREFIX)


@fastapi_app.get("/", include_in_schema=False)
async def root():
    return {"message": "Class Connect API", "docs": "/api/docs"}


app = CORSMiddleware(
    app=fastapi_app,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=600,
)


logger.info(
    "Class Connect API started",
    environment=settings.environment,
    cors_origins=settings.cors_origins_list,
)
