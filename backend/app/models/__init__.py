"""app/models/__init__.py – import all models so Alembic can discover them."""
from app.models.note import Note, ResourceType

__all__ = ["Note", "ResourceType"]
