"""Gửi bản tin Ops về Telegram — chạy hằng ngày bằng cron trên VPS.

Cron mẫu (7h sáng giờ VN = 0h UTC):
    0 0 * * * cd /opt/daythem && ./venv/bin/python scripts/ops_digest_cron.py >> /var/log/ops_digest.log 2>&1
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.telegram import _send  # gửi đồng bộ (cron không cần thread nền)  # noqa: E402
from daythem.service.ops_digest import build_ops_digest  # noqa: E402
from daythem.config import settings  # noqa: E402


def main() -> int:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        print("Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — bỏ qua.")
        return 0
    digest = build_ops_digest(SessionLocal)
    _send(digest["text"])
    print(f"Đã gửi bản tin {digest['date']}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
