"""Attribution: GV đến từ kênh nào (nối click → người dùng thật)."""

import sqlalchemy as sa
from alembic import op

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("teachers", sa.Column("source", sa.String(40), nullable=True))
    op.add_column("teachers", sa.Column("source_note", sa.String(200), nullable=True))
    op.create_index("ix_teachers_source", "teachers", ["source"])


def downgrade() -> None:
    op.drop_index("ix_teachers_source", table_name="teachers")
    op.drop_column("teachers", "source_note")
    op.drop_column("teachers", "source")
