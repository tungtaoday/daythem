"""Cron gửi push nhắc buổi dạy — chạy MỖI GIỜ trên VPS.

Cron mẫu (mỗi giờ, phút 0):
    0 * * * * cd /opt/daythem && ./venv/bin/python scripts/push_nhac_cron.py >> /var/log/push_nhac.log 2>&1

Cửa sổ nhắc 0–120 phút trước giờ dạy + dedupe theo (lớp, ngày) trong notif_events
→ chạy mỗi giờ thì mỗi buổi được nhắc đúng một lần. An toàn chạy lại tuỳ ý.
"""
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.service.push_nhac import nhac_buoi_day  # noqa: E402


def main() -> int:
    kq = nhac_buoi_day(SessionLocal)
    print(f"{datetime.now():%d/%m %H:%M} | xét {kq['xet']} buổi | gửi {kq['gui']} push"
          + (f" | {kq['bo_qua']}" if kq["bo_qua"] else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
