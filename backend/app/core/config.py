"""Application settings loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "class-connect-files"

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_allowed_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    # ── Upload ────────────────────────────────────────────────────────────────
    max_upload_size_mb: int = 50

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    # ── Rate limiting ─────────────────────────────────────────────────────────
    rate_limit_upload: str = "10/minute"
    rate_limit_delete: str = "5/minute"
    rate_limit_download: str = "60/minute"

    # ── Signed URL TTL ────────────────────────────────────────────────────────
    signed_url_ttl_seconds: int = 300

    # ── Application ───────────────────────────────────────────────────────────
    environment: str = "development"
    secret_key: str = "change-me-in-production"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
