"""Nhật ký bài đăng thủ công (reach/comment/share) — form ghi tay trên admin."""

import sqlalchemy as sa
from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "post_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("post_date", sa.String(10), nullable=False, index=True),
        sa.Column("channel", sa.String(120), nullable=False),
        sa.Column("pillar", sa.String(40)),
        sa.Column("reach", sa.Integer, nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer, nullable=False, server_default="0"),
        sa.Column("shares", sa.Integer, nullable=False, server_default="0"),
        sa.Column("link_code", sa.String(40)),
        sa.Column("note", sa.Text),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade() -> None:
    op.drop_table("post_logs")
