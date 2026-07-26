"""Link theo dõi + lượt click — đo attribution kênh khi đăng tay."""

import sqlalchemy as sa
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tracked_links",
        sa.Column("code", sa.String(40), primary_key=True),
        sa.Column("label", sa.String(120), nullable=False),
        sa.Column("target", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_table(
        "link_clicks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(40), sa.ForeignKey("tracked_links.code"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime, nullable=False, index=True),
        sa.Column("referer", sa.String(300)),
    )


def downgrade() -> None:
    op.drop_table("link_clicks")
    op.drop_table("tracked_links")
