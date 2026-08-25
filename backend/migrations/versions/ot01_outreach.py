"""outreach — nhật ký chăm sóc giáo viên

Revision ID: ot01outreach
Revises: ue01uievents
"""
from alembic import op
import sqlalchemy as sa

revision = "ot01outreach"
down_revision = "ue01uievents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "outreach",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("teachers.id"), nullable=False),
        sa.Column("kind", sa.String(12), nullable=False),
        sa.Column("note", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    for c in ("teacher_id", "kind", "created_at"):
        op.create_index(f"ix_outreach_{c}", "outreach", [c])


def downgrade() -> None:
    op.drop_table("outreach")
