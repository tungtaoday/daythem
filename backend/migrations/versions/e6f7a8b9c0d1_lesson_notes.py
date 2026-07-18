"""lesson/homework notes trên buổi điểm danh (báo cáo buổi học)

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-07-18

"""
from alembic import op
import sqlalchemy as sa

revision = "e6f7a8b9c0d1"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("attendance_sessions", sa.Column("lesson_note", sa.Text(), nullable=True))
    op.add_column("attendance_sessions", sa.Column("homework_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("attendance_sessions", "homework_note")
    op.drop_column("attendance_sessions", "lesson_note")
