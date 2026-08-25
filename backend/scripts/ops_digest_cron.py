"""Gửi bản tin sáng về Telegram — chạy hằng ngày bằng cron trên VPS.

Cron mẫu (7h sáng giờ VN = 0h UTC):
    0 0 * * * cd /opt/daythem && ./venv/bin/python scripts/ops_digest_cron.py >> /var/log/ops_digest.log 2>&1

Từ 22/08 gửi bản VIỆC (viec_hom_nay): chỉ những gì phải làm, kèm tin nhắn soạn
sẵn copy là gửi. Bản chỉ số cũ (build_ops_digest) dài ~40 dòng, đọc xong vẫn phải
tự nghĩ "vậy giờ làm gì" — số liệu vẫn còn nguyên ở /admin/ops và /admin/users,
chỉ không bắt đọc mỗi sáng nữa. Đặt CHI_SO=1 để gửi lại bản cũ.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.telegram import _send  # gửi đồng bộ (cron không cần thread nền)  # noqa: E402
from daythem.service.ops_digest import build_ops_digest  # noqa: E402
from daythem.service.viec_hom_nay import viec_hom_nay  # noqa: E402
from daythem.config import settings  # noqa: E402


def main() -> int:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        print("Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — bỏ qua.")
        return 0
    if os.getenv("CHI_SO") == "1":
        digest = build_ops_digest(SessionLocal)
        _send(digest["text"])
        print(f"Đã gửi bản CHỈ SỐ {digest['date']}.")
        return 0
    # Kèm nút bấm: "✓ Đã nhắn" / "💬 Họ hỏi cách" cho từng người. Bấm một cái
    # thay vì gõ lệnh — việc này làm mỗi ngày trên điện thoại, gõ thì không bền.
    text, markup = viec_hom_nay(SessionLocal, kem_nut=True)
    _send(text, reply_markup=markup)
    print(f"Đã gửi bản VIỆC ({len(text.splitlines())} dòng).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
