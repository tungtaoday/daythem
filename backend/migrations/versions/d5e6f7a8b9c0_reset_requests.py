"""password reset requests (form quên mật khẩu → hàng chờ admin)

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-07-14

"""
from alembic import op
import sqlalchemy as sa

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_reset_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("handled_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_requests_phone", "password_reset_requests", ["phone"])
    op.create_index("ix_password_reset_requests_status", "password_reset_requests", ["status"])
    op.create_index("ix_password_reset_requests_created_at", "password_reset_requests", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_requests_created_at", table_name="password_reset_requests")
    op.drop_index("ix_password_reset_requests_status", table_name="password_reset_requests")
    op.drop_index("ix_password_reset_requests_phone", table_name="password_reset_requests")
    op.drop_table("password_reset_requests")
