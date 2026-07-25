"""Chuẩn hoá classes.fee_type về bộ giá trị month | session | course.

'monthly' là default cũ của ORM (client gửi 'month') → DB đang lẫn 2 giá trị
cho cùng 1 nghĩa. Quy hết về 'month'; giá trị rỗng/NULL cũng vậy.
"""

from alembic import op

revision = "f7a8b9c0d1e2"
down_revision = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE classes SET fee_type = 'month' "
        "WHERE fee_type IS NULL OR fee_type = '' OR fee_type = 'monthly'"
    )


def downgrade() -> None:
    pass  # không có đường lùi ý nghĩa — 'monthly' cũ chỉ là default chưa ai đọc
