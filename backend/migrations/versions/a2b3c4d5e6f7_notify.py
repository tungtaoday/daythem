"""notification engine: teacher prefs/tags + notif_events

Revision ID: a2b3c4d5e6f7
Revises: 11049cb9f0cf
Create Date: 2026-06-27

"""
from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "11049cb9f0cf"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("teachers", sa.Column("notif_prefs", sa.JSON(), nullable=True))
    op.add_column("teachers", sa.Column("notif_tags", sa.JSON(), nullable=True))
    op.create_table(
        "notif_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("teacher_id", sa.String(length=36), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("rule", sa.String(length=40), nullable=True),
        sa.Column("event_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notif_events_teacher_id", "notif_events", ["teacher_id"])
    op.create_index("ix_notif_events_created_at", "notif_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_notif_events_created_at", table_name="notif_events")
    op.drop_index("ix_notif_events_teacher_id", table_name="notif_events")
    op.drop_table("notif_events")
    op.drop_column("teachers", "notif_tags")
    op.drop_column("teachers", "notif_prefs")
