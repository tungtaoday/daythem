"""Admin CLI cho người vận hành 1 mình (chưa có dashboard).

Chạy trên server:
  ./venv/bin/python -m daythem.admin stats
  ./venv/bin/python -m daythem.admin reset-password 0912345678 matkhaumoi
  ./venv/bin/python -m daythem.admin teachers 20
"""
import sys
from datetime import timedelta

from sqlalchemy import select, func

from daythem.phone import normalize_phone
from daythem.adapters.database import SessionLocal
from daythem.adapters.orm import (
    TeacherORM, ClassORM, StudentORM, AttendanceSessionORM, TuitionORM,
)
from daythem.service.handlers import _hash_password, _now


def _stats() -> None:
    s = SessionLocal()
    try:
        wk = _now() - timedelta(days=7)
        teachers = s.scalar(select(func.count(TeacherORM.id))) or 0
        classes = s.scalar(select(func.count(ClassORM.id)).where(ClassORM.archived == False)) or 0  # noqa: E712
        students = s.scalar(select(func.count(StudentORM.id))) or 0
        sessions = s.scalar(select(func.count(AttendanceSessionORM.id))) or 0
        paid = s.scalar(select(func.count(TuitionORM.id)).where(TuitionORM.paid == True)) or 0  # noqa: E712
        new_teachers = s.scalar(select(func.count(TeacherORM.id)).where(TeacherORM.created_at >= wk)) or 0
        active = s.scalar(
            select(func.count(func.distinct(AttendanceSessionORM.class_id)))
            .where(AttendanceSessionORM.created_at >= wk)
        ) or 0
        print("=== GieoChữ · thống kê ===")
        print(f"Giáo viên:            {teachers}   (mới 7 ngày: {new_teachers})")
        print(f"Lớp đang hoạt động:   {classes}")
        print(f"Học sinh:             {students}")
        print(f"Buổi đã điểm danh:    {sessions}")
        print(f"Khoản học phí đã thu: {paid}")
        print(f"Lớp có điểm danh 7 ngày qua: {active}")
    finally:
        s.close()


def _reset_password(phone: str, new_password: str) -> None:
    if len(new_password) < 6:
        print("Lỗi: mật khẩu mới phải ≥ 6 ký tự.")
        return
    phone = normalize_phone(phone)
    s = SessionLocal()
    try:
        teacher = s.scalar(select(TeacherORM).where(TeacherORM.phone == phone))
        if not teacher:
            print(f"Không tìm thấy giáo viên với SĐT {phone}.")
            return
        teacher.password_hash = _hash_password(new_password)
        s.commit()
        print(f"✓ Đã đặt lại mật khẩu cho {teacher.name or '(chưa đặt tên)'} · {phone}.")
        print("  Nhắn mật khẩu mới cho họ qua Zalo/điện thoại.")
    finally:
        s.close()


def _teachers(limit: int = 20) -> None:
    s = SessionLocal()
    try:
        rows = s.scalars(
            select(TeacherORM).order_by(TeacherORM.created_at.desc()).limit(limit)
        ).all()
        print(f"=== {len(rows)} giáo viên gần nhất ===")
        for t in rows:
            n_cls = s.scalar(select(func.count(ClassORM.id)).where(ClassORM.teacher_id == t.id)) or 0
            print(f"{t.phone:14} {t.name or '(chưa tên)':22} {n_cls} lớp   {t.created_at.strftime('%d/%m/%Y')}")
    finally:
        s.close()


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return
    cmd = args[0]
    if cmd == "stats":
        _stats()
    elif cmd == "reset-password" and len(args) >= 3:
        _reset_password(args[1], args[2])
    elif cmd == "teachers":
        _teachers(int(args[1]) if len(args) > 1 else 20)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
