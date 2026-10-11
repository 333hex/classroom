"""Initial notes table

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create resource_type enum
    resource_type_enum = postgresql.ENUM(
        "pdf",
        "doc",
        "docx",
        "image",
        "typed",
        "video_link",
        "website_link",
        name="resource_type_enum",
        create_type=False,
    )
    resource_type_enum.create(op.get_bind(), checkfirst=True)

    # Create notes table
    op.create_table(
        "notes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("subject", sa.String(100), nullable=False),
        sa.Column("unit_number", sa.Integer, nullable=True),
        sa.Column("topic", sa.String(200), nullable=True),
        sa.Column("class_date", sa.Date, nullable=True),
        sa.Column(
            "resource_type",
            resource_type_enum,
            nullable=False,
        ),
        sa.Column("typed_content", sa.Text, nullable=True),
        sa.Column("external_url", sa.String(2048), nullable=True),
        sa.Column("storage_path", sa.String(1024), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("file_size", sa.Integer, nullable=True),
        sa.Column("deletion_token_hash", sa.String(64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "(typed_content IS NOT NULL) OR (external_url IS NOT NULL) OR (storage_path IS NOT NULL)",
            name="ck_notes_has_content",
        ),
        sa.CheckConstraint(
            "(external_url IS NULL) OR (external_url LIKE 'https://%')",
            name="ck_notes_external_url_scheme",
        ),
    )

    # Indexes
    op.create_index("ix_notes_title", "notes", ["title"])
    op.create_index("ix_notes_subject", "notes", ["subject"])
    op.create_index("ix_notes_topic", "notes", ["topic"])
    op.create_index("ix_notes_resource_type", "notes", ["resource_type"])
    op.create_index("ix_notes_created_at", "notes", ["created_at"])
    op.create_index(
        "ix_notes_subject_resource_type",
        "notes",
        ["subject", "resource_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_notes_subject_resource_type", table_name="notes")
    op.drop_index("ix_notes_created_at", table_name="notes")
    op.drop_index("ix_notes_resource_type", table_name="notes")
    op.drop_index("ix_notes_topic", table_name="notes")
    op.drop_index("ix_notes_subject", table_name="notes")
    op.drop_index("ix_notes_title", table_name="notes")
    op.drop_table("notes")

    sa.Enum(name="resource_type_enum").drop(op.get_bind(), checkfirst=True)
