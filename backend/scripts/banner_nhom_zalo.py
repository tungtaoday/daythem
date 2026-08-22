"""Bật/tắt banner mời vào nhóm Zalo hỗ trợ — hiện ngay trên màn Home của app.

Vì sao dùng banner chứ không sửa app: banner đọc file promo.json trên server ở
MỖI lần gọi, nên đổi nội dung là có hiệu lực tức thì cho mọi giáo viên. Nhúng
link vào mã app thì mỗi lần đổi phải build lại và chờ Apple/Google duyệt vài
ngày — và link nhóm Zalo là thứ có thể phải đổi (nhóm đầy, đổi nhóm, hết hạn).

Dùng:
    python scripts/banner_nhom_zalo.py bat "https://zalo.me/g/abcxyz"
    python scripts/banner_nhom_zalo.py tat
    python scripts/banner_nhom_zalo.py xem

Đổi ID mỗi lần bật lại → người đã bấm tắt banner cũ vẫn thấy banner mới.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime

PROMO = os.environ.get("PROMO_PATH", "/opt/daythem/promo.json")

# Giữ ngắn: banner nằm trên màn Home, dài quá thì đẩy nội dung chính xuống dưới.
TIEU_DE = "Nhóm Zalo hỏi đáp GieoChữ"
NOI_DUNG = ("Vướng chỗ nào cứ hỏi trong nhóm, có người trả lời ngay. "
            "Cùng các thầy cô đang dùng app.")
NHAN_NUT = "Vào nhóm Zalo"


def xem() -> None:
    if not os.path.isfile(PROMO):
        print(f"Chưa có file {PROMO}")
        return
    with open(PROMO, encoding="utf-8") as f:
        d = json.load(f)
    print(f"đang bật : {d.get('active')}")
    print(f"id       : {d.get('id')}")
    print(f"tiêu đề  : {d.get('title')}")
    print(f"link     : {d.get('cta_url')}")


def bat(link: str) -> None:
    if not link.startswith(("https://zalo.me/", "https://chat.zalo.me/")):
        sys.exit(f"Link không giống link nhóm Zalo: {link}\n"
                 "Cần dạng https://zalo.me/g/xxxxxx (lấy ở nhóm → Tuỳ chọn → Link tham gia).")
    data = {
        # Đổi id theo ngày → ai đã tắt banner lần trước vẫn thấy lần này.
        "id": f"nhom-zalo-{datetime.now():%Y%m%d}",
        "active": True,
        "title": TIEU_DE,
        "body": NOI_DUNG,
        "cta_label": NHAN_NUT,
        "cta_url": link,
        "tone": "green",
    }
    with open(PROMO, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"ĐÃ BẬT — id {data['id']}")
    print(f"link: {link}")
    print("Không cần khởi động lại: /promo đọc lại file ở mỗi lần gọi.")


def tat() -> None:
    d = {"id": "off", "active": False, "title": "", "body": ""}
    with open(PROMO, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print("ĐÃ TẮT banner.")


if __name__ == "__main__":
    lenh = sys.argv[1] if len(sys.argv) > 1 else "xem"
    if lenh == "bat":
        if len(sys.argv) < 3:
            sys.exit('Thiếu link. Ví dụ: python scripts/banner_nhom_zalo.py bat "https://zalo.me/g/abcxyz"')
        bat(sys.argv[2])
    elif lenh == "tat":
        tat()
    else:
        xem()
