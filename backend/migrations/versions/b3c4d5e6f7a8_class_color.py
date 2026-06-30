"""class color (nhận diện màu lớp)

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-06-30

"""
from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a8"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("classes", sa.Column("color", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("classes", "color")
