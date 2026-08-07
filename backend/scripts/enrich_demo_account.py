"""Làm dày tài khoản demo cho người duyệt App Store / CH Play.

Apple ghi rõ: *"nếu chúng tôi không truy cập được đầy đủ các phần của app, app có
thể bị từ chối"*. Tài khoản demo chỉ có 1 lớp trống thì người duyệt mở tab nào cũng
thấy màn hình rỗng — dễ tưởng app hỏng.

Script tạo dữ liệu **qua API thật**, không chọc thẳng DB, để mọi ràng buộc nghiệp vụ
được tôn trọng y như người dùng thật thao tác.

    python scripts/enrich_demo_account.py                 # chỉ XEM sẽ tạo gì
    python scripts/enrich_demo_account.py --apply         # tạo thật
    python scripts/enrich_demo_account.py --apply --api http://localhost:8000/api/v1

An toàn: chỉ THÊM, không xoá gì. Chạy lại nhiều lần sẽ tạo trùng — nên chạy một lần.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

API = "https://daythem.doitay.vn/api/v1"
PHONE = "0905550002"
PASSWORD = "test123"

# Lớp thứ hai — khác môn, khác cách thu (theo buổi) để người duyệt thấy cả 2 kiểu.
NEW_CLASS = {
    "name": "Văn 9 Tối",
    "subject": "Văn",
    "grade": "9",
    "default_fee": 150000,
    "fee_type": "session",
    "color": "coral",
    "schedule": {"day": 3, "days": [3, 6], "start_time": "19:30",
                 "duration": 90, "location": "Tại nhà"},
}

NEW_STUDENTS = [
    ("Nguyễn Khánh Linh", "Chị Hoa", "0901000001"),
    ("Trần Gia Huy", "Anh Dũng", "0901000002"),
    ("Lê Bảo Ngọc", "Chị Mai", "0901000003"),
    ("Phạm Đức Anh", "Anh Sơn", "0901000004"),
]

LESSONS = [
    ("Ôn tập văn nghị luận xã hội", "Viết dàn ý đề số 3 trang 45"),
    ("Phân tích Chiếc lược ngà", "Học thuộc 2 đoạn trích đã đánh dấu"),
    ("Luyện đề thi vào 10", "Hoàn thành đề số 1, nộp buổi sau"),
]


def call(method: str, path: str, token: str | None = None, body: dict | None = None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json",
                 **({"Authorization": f"Bearer {token}"} if token else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"LỖI {e.code} khi {method} {path}: {e.read().decode()[:300]}")


def main(apply: bool) -> int:
    print(f"API: {API}\n")
    tok = call("POST", "/auth/login", body={"phone": PHONE, "password": PASSWORD})["token"]
    classes = call("GET", "/classes", tok)
    print(f"Hiện có {len(classes)} lớp:")
    for c in classes:
        print(f"  - {c['name']} · {c.get('student_count', '?')} HS")

    print("\nSẽ thêm:")
    print(f"  • Lớp {NEW_CLASS['name']!r} ({NEW_CLASS['subject']} {NEW_CLASS['grade']}, "
          f"{NEW_CLASS['default_fee']:,.0f}đ/buổi)")
    print(f"  • {len(NEW_STUDENTS)} học sinh + phụ huynh")
    print(f"  • {len(LESSONS)} buổi điểm danh (có ghi chú bài học + dặn dò)")
    print("  • Thu học phí một phần ở CẢ HAI lớp (để thấy 'ai chưa nộp')")
    print("  • 1 báo cáo tuần")

    if not apply:
        print("\n(dry-run — chưa tạo gì. Chạy lại với --apply)")
        return 0

    print("\n--- ĐANG TẠO ---")
    klass = call("POST", "/classes", tok, NEW_CLASS)
    cid = klass["id"]
    print(f"  ✓ lớp {klass['name']}")

    sids = []
    for name, pname, pphone in NEW_STUDENTS:
        s = call("POST", f"/classes/{cid}/students", tok,
                 {"name": name, "parent_name": pname, "parent_phone": pphone})
        sids.append(s["id"])
    print(f"  ✓ {len(sids)} học sinh")

    # Điểm danh 3 buổi gần đây, có 1 em vắng để thấy tính năng ghi lý do.
    today = date.today()
    for i, (lesson, hw) in enumerate(LESSONS):
        d = (today - timedelta(days=(len(LESSONS) - i) * 3)).isoformat()
        recs = [{"student_id": sid, "present": True} for sid in sids]
        if i == 1:
            recs[2] = {"student_id": sids[2], "present": False, "absence_reason": "Con bị ốm"}
        call("POST", f"/classes/{cid}/attendance", tok,
             {"session_date": d, "records": recs, "lesson_note": lesson, "homework_note": hw})
    print(f"  ✓ {len(LESSONS)} buổi điểm danh")

    # Thu phí: 2/4 em lớp mới đã nộp → còn 2 em chưa, đúng cảnh "ai chưa đóng".
    month = today.strftime("%Y-%m")
    for sid in sids[:2]:
        call("POST", f"/classes/{cid}/tuition/payment", tok,
             {"student_id": sid, "paid": True, "month": month})
    print("  ✓ thu phí 2/4 em lớp mới")

    # Lớp cũ: thu 3/5 em để tab Học phí không còn 0đ.
    if classes:
        old = classes[0]["id"]
        olds = call("GET", f"/classes/{old}/students", tok)
        for s in olds[:3]:
            call("POST", f"/classes/{old}/tuition/payment", tok,
                 {"student_id": s["id"], "paid": True, "month": month})
        print(f"  ✓ thu phí 3/{len(olds)} em lớp {classes[0]['name']}")

    monday = today - timedelta(days=today.weekday())
    call("POST", f"/classes/{cid}/reports/generate", tok, {"week_start": monday.isoformat()})
    print("  ✓ 1 báo cáo tuần")

    after = call("GET", "/classes", tok)
    print(f"\nXong. Tài khoản demo giờ có {len(after)} lớp:")
    for c in after:
        print(f"  - {c['name']} · {c.get('student_count', '?')} HS · "
              f"{c['default_fee']:,.0f}đ/{c['fee_type']}")
    return 0


if __name__ == "__main__":
    if "--api" in sys.argv:
        API = sys.argv[sys.argv.index("--api") + 1]
    raise SystemExit(main(apply="--apply" in sys.argv))
