"""growth_notes — nhận xét vận hành owner gõ qua Telegram

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "growth_notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(40)),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_growth_notes_status", "growth_notes", ["status"])
    op.create_index("ix_growth_notes_created_at", "growth_notes", ["created_at"])


def downgrade() -> None:
    op.drop_table("growth_notes")
