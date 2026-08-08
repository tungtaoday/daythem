"""gtm_tasks — kế hoạch GTM có trạng thái (để traceback được)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gtm_tasks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("key", sa.String(60), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("block", sa.String(40), nullable=False),
        sa.Column("why", sa.Text()),
        sa.Column("source", sa.String(120)),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("owner", sa.String(20), nullable=False, server_default="anh"),
        sa.Column("status", sa.String(20), nullable=False, server_default="todo"),
        sa.Column("done_at", sa.DateTime()),
        sa.Column("note", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_gtm_tasks_key", "gtm_tasks", ["key"], unique=True)
    op.create_index("ix_gtm_tasks_block", "gtm_tasks", ["block"])
    op.create_index("ix_gtm_tasks_priority", "gtm_tasks", ["priority"])
    op.create_index("ix_gtm_tasks_status", "gtm_tasks", ["status"])


def downgrade() -> None:
    op.drop_table("gtm_tasks")
