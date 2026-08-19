"""ui_events — bước chân của GV trong app (tách khỏi activity_events)

Revision ID: ue01uievents
Revises: e5f6a7b8c9d0
"""
from alembic import op
import sqlalchemy as sa

revision = "ue01uievents"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ui_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("teachers.id"), nullable=False),
        sa.Column("screen", sa.String(60), nullable=False),
        sa.Column("action", sa.String(60), nullable=True),
        sa.Column("session_id", sa.String(36), nullable=True),
        sa.Column("platform", sa.String(12), nullable=True),
        sa.Column("app_version", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for col in ("teacher_id", "screen", "session_id", "created_at"):
        op.create_index(f"ix_ui_events_{col}", "ui_events", [col])


def downgrade() -> None:
    op.drop_table("ui_events")
