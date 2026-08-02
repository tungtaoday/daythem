"""Xoá tài khoản test khỏi DB (dọn số liệu North Star cho đúng thực tế).

Chỉ xoá những SĐT liệt kê trong TARGETS. Dùng handle_delete_account() nên dọn
sạch cả lớp, học sinh, điểm danh, học phí, thông báo, báo cáo — không để lại
dòng mồ côi.

AN TOÀN:
  - Bắt buộc sao lưu trước. Không có file sao lưu là script từ chối chạy.
  - Mặc định dry-run. Phải gõ --apply mới thật sự xoá.

Chạy trên server:
    cd /opt/daythem
    ./venv/bin/python scripts/delete_test_accounts.py            # xem trước
    ./venv/bin/python scripts/delete_test_accounts.py --apply    # xoá thật
"""
from __future__ import annotations

import datetime
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

from sqlalchemy import select  # noqa: E402

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.orm import (  # noqa: E402
    TeacherORM, ClassORM, StudentORM, StudentFeeORM,
    AttendanceSessionORM, AttendanceRecordORM, TuitionORM,
)
from daythem.service.handlers import handle_delete_account  # noqa: E402
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork  # noqa: E402

# SĐT cần xoá — sửa danh sách này khi cần dọn tiếp.
TARGETS = [
    "0672585990",   # 'Tung' — gõ nhầm từ 0972585990, đầu số 06 không tồn tại ở VN
    "0901234567",   # 'đ' — tài khoản gõ thử
]

BACKUP_PATH = Path(__file__).resolve().parent.parent / "deleted-teachers-backup.json"


def _row(r) -> dict:
    out = {}
    for c in r.__table__.columns:
        v = getattr(r, c.name)
        out[c.name] = v.isoformat() if isinstance(v, (datetime.datetime, datetime.date)) else v
    return out


def collect(s) -> list[dict]:
    """Gom toàn bộ dữ liệu của các tài khoản đích, đủ để dựng lại nếu xoá nhầm."""
    out = []
    for phone in TARGETS:
        t = s.scalar(select(TeacherORM).where(TeacherORM.phone == phone))
        if not t:
            print(f"  {phone}: không tìm thấy (có thể đã xoá rồi)")
            continue
        classes = s.scalars(select(ClassORM).where(ClassORM.teacher_id == t.id)).all()
        cids = [c.id for c in classes]
        students = s.scalars(select(StudentORM).where(StudentORM.class_id.in_(cids))).all() if cids else []
        sids = [x.id for x in students]
        sessions = s.scalars(select(AttendanceSessionORM).where(
            AttendanceSessionORM.class_id.in_(cids))).all() if cids else []
        records = s.scalars(select(AttendanceRecordORM).where(
            AttendanceRecordORM.session_id.in_([x.id for x in sessions]))).all() if sessions else []
        fees = s.scalars(select(StudentFeeORM).where(
            StudentFeeORM.student_id.in_(sids))).all() if sids else []
        tuition = s.scalars(select(TuitionORM).where(
            TuitionORM.class_id.in_(cids))).all() if cids else []
        out.append({
            "teacher": _row(t),
            "classes": [_row(x) for x in classes],
            "students": [_row(x) for x in students],
            "attendance_sessions": [_row(x) for x in sessions],
            "attendance_records": [_row(x) for x in records],
            "student_fees": [_row(x) for x in fees],
            "tuition": [_row(x) for x in tuition],
        })
    return out


def main(apply: bool) -> int:
    s = SessionLocal()
    try:
        print("=== Tài khoản sẽ xoá ===")
        data = collect(s)
        if not data:
            print("Không có gì để xoá.")
            return 0

        for b in data:
            t = b["teacher"]
            print(f"  {t['phone']} · {t['name']!r} · tạo {t['created_at']}")
            print(f"      {len(b['classes'])} lớp · {len(b['students'])} học sinh · "
                  f"{len(b['attendance_sessions'])} buổi điểm danh · {len(b['tuition'])} bản ghi học phí")
            for st in b["students"]:
                print(f"      - HS: {st.get('name')!r}")

        BACKUP_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n✓ Đã sao lưu đầy đủ → {BACKUP_PATH}")

        if not apply:
            print("\n(dry-run — chưa xoá gì. Chạy lại với --apply để xoá thật)")
            return 0

        print("\n=== XOÁ ===")
        for b in data:
            tid, phone = b["teacher"]["id"], b["teacher"]["phone"]
            uow = SqlAlchemyUnitOfWork()
            with uow:
                handle_delete_account(tid, uow)
            print(f"  ✓ đã xoá {phone}")
    finally:
        s.close()

    s2 = SessionLocal()
    try:
        left = s2.scalars(select(TeacherORM).order_by(TeacherORM.created_at)).all()
        print(f"\nCòn lại {len(left)} tài khoản:")
        for t in left:
            print(f"  {t.phone}  {t.name!r}")
    finally:
        s2.close()
    return 0


if __name__ == "__main__":
    if not os.environ.get("SKIP_BACKUP_CHECK") and "--apply" in sys.argv and not BACKUP_PATH.exists():
        # Lần chạy dry-run đầu tiên sẽ tạo file này; ép phải xem trước rồi mới xoá.
        sys.exit(f"DỪNG LẠI: chưa có {BACKUP_PATH}. Chạy dry-run trước (không có --apply).")
    raise SystemExit(main(apply="--apply" in sys.argv))
