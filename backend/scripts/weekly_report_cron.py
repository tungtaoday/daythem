"""Gửi BÁO CÁO TUẦN về Telegram — chạy sáng Thứ 2 bằng cron trên VPS.

Cron mẫu (7h sáng Thứ 2 giờ VN = 0h UTC Thứ 2):
    0 0 * * 1 cd /opt/daythem && ./venv/bin/python scripts/weekly_report_cron.py >> /var/log/weekly_report.log 2>&1

Xem thử không gửi:
    ./venv/bin/python scripts/weekly_report_cron.py --dry-run
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.telegram import _send  # gửi đồng bộ (cron không cần thread nền)  # noqa: E402
from daythem.config import settings  # noqa: E402
from daythem.service.weekly_report import build_weekly_report  # noqa: E402


def main(dry_run: bool) -> int:
    report = build_weekly_report(SessionLocal)

    if dry_run:
        # In ra dạng đọc được (bỏ thẻ HTML của Telegram).
        import re
        print(re.sub(r"</?[bi]>", "", report["text"]))
        return 0

    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        print("Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — bỏ qua.")
        return 0

    _send(report["text"])
    print(f"Đã gửi báo cáo tuần {report['week_start']} → {report['week_end']}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(dry_run="--dry-run" in sys.argv))
