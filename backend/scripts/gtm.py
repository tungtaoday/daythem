"""Kế hoạch GTM — xem và đánh dấu tiến độ.

    python scripts/gtm.py                      # xem toàn bộ kế hoạch + tiến độ
    python scripts/gtm.py seed                 # gieo/cập nhật kế hoạch vào DB
    python scripts/gtm.py done ios-submit      # đánh dấu XONG
    python scripts/gtm.py doing msg-n1         # đánh dấu ĐANG LÀM
    python scripts/gtm.py todo msg-n1          # trả về chưa làm
    python scripts/gtm.py skip zalo-oa "để sau"  # bỏ qua, có lý do

Mã việc (`key`) hiện ở cột trái khi chạy không tham số.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

from sqlalchemy import select  # noqa: E402

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.orm import GtmTaskORM  # noqa: E402
from daythem.service.gtm_plan import auto_verify, mark, progress, seed_tasks  # noqa: E402

ICON = {"todo": "⬜", "doing": "🔸", "done": "✅", "skip": "⏭"}


def show() -> None:
    auto = auto_verify(SessionLocal)
    if auto:
        print(f"(tự xác nhận xong: {', '.join(auto)})\n")

    s = SessionLocal()
    try:
        rows = s.scalars(select(GtmTaskORM).order_by(GtmTaskORM.priority)).all()
    finally:
        s.close()

    if not rows:
        print("Chưa gieo kế hoạch. Chạy:  python scripts/gtm.py seed")
        return

    block = None
    for t in rows:
        if t.block != block:
            block = t.block
            print(f"\n── {block} ──")
        who = "" if t.owner == "anh" else "  (Claude)"
        print(f"  {ICON.get(t.status, '?')} {t.key:<22} {t.title}{who}")
        if t.status in ("todo", "doing"):
            print(f"     └ {t.why}")

    pg = progress(SessionLocal)
    print(f"\nTiến độ việc lớn: {pg['done']}/{pg['total']} xong · {pg['doing']} đang làm")


def main(argv: list[str]) -> int:
    if not argv:
        show()
        return 0

    cmd = argv[0]
    if cmd == "seed":
        r = seed_tasks(SessionLocal)
        print(f"Đã gieo: thêm {r['added']}, cập nhật {r['updated']}, tổng {r['total']} việc.")
        return 0

    if cmd in ("done", "doing", "todo", "skip"):
        if len(argv) < 2:
            print(f"Thiếu mã việc. Ví dụ: python scripts/gtm.py {cmd} ios-submit")
            return 1
        note = argv[2] if len(argv) > 2 else None
        try:
            r = mark(SessionLocal, argv[1], cmd, note)
        except ValueError as e:
            print(f"Lỗi: {e}")
            return 1
        print(f"{ICON[cmd]} {r['title']}  →  {r['status']}")
        return 0

    print(__doc__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
