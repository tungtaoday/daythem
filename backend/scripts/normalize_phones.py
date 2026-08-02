"""Chuẩn hoá SĐT đã lưu trong DB về dạng `0xxxxxxxxx`.

Code mới đã chuẩn hoá mọi SĐT ghi vào từ nay. Script này dọn các dòng CŨ được
tạo trước đó, để tài khoản cũ vẫn tìm thấy được sau khi deploy.

    python scripts/normalize_phones.py            # chỉ XEM, không sửa gì
    python scripts/normalize_phones.py --apply    # thực sự sửa

An toàn:
  - Mặc định là dry-run. Phải gõ --apply mới ghi.
  - Nếu hai dòng chuẩn hoá ra CÙNG một số (đụng độ) → KHÔNG tự gộp, chỉ báo cáo.
    Gộp hai tài khoản là quyết định có mất mát dữ liệu, phải do người quyết.
"""
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

# Console Windows mặc định cp1252 → vỡ khi in tiếng Việt có dấu.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

from sqlalchemy import select  # noqa: E402

from daythem.adapters.database import SessionLocal  # noqa: E402
from daythem.adapters.orm import (  # noqa: E402
    TeacherORM, OTPORM, PasswordResetRequestORM,
)
from daythem.phone import normalize_phone  # noqa: E402

TABLES = [
    ("teachers", TeacherORM),
    ("otps", OTPORM),
    ("password_reset_requests", PasswordResetRequestORM),
]


def main(apply: bool) -> int:
    s = SessionLocal()
    total_changed = 0
    blocked = 0
    try:
        for label, model in TABLES:
            rows = s.scalars(select(model)).all()
            changes = [(r, r.phone, normalize_phone(r.phone))
                       for r in rows if r.phone and normalize_phone(r.phone) != r.phone]

            # Đụng độ: dòng sắp đổi trùng với một SĐT đã tồn tại, hoặc hai dòng
            # cùng đổi về một số. Chỉ nguy hiểm thật ở bảng teachers (unique danh tính).
            canon = defaultdict(list)
            for r in rows:
                if r.phone:
                    canon[normalize_phone(r.phone)].append(r)
            dups = {k: v for k, v in canon.items() if len(v) > 1}

            print(f"\n=== {label} — {len(rows)} dòng ===")
            if not changes and not dups:
                print("  ✓ đã chuẩn hết, không cần làm gì")
                continue

            for r, old, new in changes:
                print(f"  {old!r:>20}  →  {new!r}")

            if dups:
                print(f"\n  ⚠ ĐỤNG ĐỘ — {len(dups)} số có nhiều hơn 1 dòng:")
                for num, group in dups.items():
                    print(f"    {num}:")
                    for g in group:
                        extra = ""
                        if label == "teachers":
                            extra = f" · tên={g.name!r} · tạo={g.created_at}"
                        print(f"      - id={g.id[:8]} phone={g.phone!r}{extra}")
                if label == "teachers":
                    print("    → KHÔNG tự gộp. Xem hai tài khoản có dữ liệu gì,")
                    print("      quyết định giữ cái nào rồi xử lý tay.")
                    blocked += len(dups)
                    continue  # bỏ qua cả bảng để không tạo unique-violation

            if apply:
                for r, _old, new in changes:
                    r.phone = new
                s.commit()
                print(f"  ✓ đã sửa {len(changes)} dòng")
            else:
                print(f"  (dry-run — sẽ sửa {len(changes)} dòng khi chạy với --apply)")
            total_changed += len(changes)
    finally:
        s.close()

    print("\n" + "─" * 60)
    if blocked:
        print(f"⚠ {blocked} số bị đụng độ ở bảng teachers — cần xử lý tay trước.")
    if not apply:
        print(f"Dry-run: {total_changed} dòng sẽ đổi. Chạy lại với --apply để ghi.")
    else:
        print(f"Xong: đã đổi {total_changed} dòng.")
    return 1 if blocked else 0


if __name__ == "__main__":
    raise SystemExit(main(apply="--apply" in sys.argv))
