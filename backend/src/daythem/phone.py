"""Chuẩn hoá số điện thoại Việt Nam về một dạng duy nhất.

Vì SĐT là DANH TÍNH của giáo viên trong GieoChữ, hai cách viết khác nhau của cùng
một số phải quy về cùng một chuỗi. Nếu không, `verify_otp` / `login` sẽ không tìm
thấy tài khoản cũ và **tạo tài khoản trắng mới** — giáo viên mở app lên thấy mất
sạch lớp và học sinh.

Dạng chuẩn: 10 chữ số bắt đầu bằng `0` (vd `0905550002`).

Nguyên tắc: chỉ gộp khi CHẮC CHẮN là cùng một số. Tách nhầm một người thành hai
tài khoản đã tệ, nhưng gộp nhầm hai người vào một tài khoản còn tệ hơn nhiều.
"""
from __future__ import annotations

# Đầu số di động VN hợp lệ sau số 0 (03/05/07/08/09).
_MOBILE_LEADS = "35789"


def normalize_phone(raw: str | None) -> str:
    """Đưa SĐT về dạng chuẩn `0xxxxxxxxx`.

    Xử lý được: khoảng trắng, dấu chấm/gạch/ngoặc, tiền tố `+84` / `84` / `0084`,
    và số bị mất số 0 đầu (rất hay gặp khi dán từ Excel — Excel cắt số 0 đứng đầu).

    Chuỗi không nhận dạng được thì trả về nguyên phần chữ số, KHÔNG raise —
    để tầng gọi tự quyết định báo lỗi thế nào.

    >>> normalize_phone(" 0905 550 002 ")
    '0905550002'
    >>> normalize_phone("+84905550002")
    '0905550002'
    >>> normalize_phone("905550002")      # Excel nuốt mất số 0
    '0905550002'
    """
    if not raw:
        return ""

    s = str(raw).strip()
    had_plus = s.startswith("+")
    digits = "".join(ch for ch in s if ch.isdigit())

    if not digits:
        return ""

    # 0084... → 84...  (tiền tố quay số quốc tế)
    if digits.startswith("00"):
        digits = digits[2:]
        had_plus = True

    # +84xxxxxxxxx / 84xxxxxxxxx → 0xxxxxxxxx
    # Phân biệt bằng ĐỘ DÀI: `084xxxxxxx` (10 số) là số Vinaphone hợp lệ,
    # còn `84xxxxxxxxx` (11 số) là mã quốc gia + số thuê bao.
    if digits.startswith("84") and (had_plus or len(digits) >= 11):
        digits = "0" + digits[2:]

    # 9 chữ số, bắt đầu bằng đầu số di động → bị mất số 0 đứng đầu
    elif len(digits) == 9 and digits[0] in _MOBILE_LEADS:
        digits = "0" + digits

    return digits


def is_valid_vn_mobile(phone: str | None) -> bool:
    """True nếu đã chuẩn hoá ra đúng dạng di động VN (10 số, `0` + đầu số hợp lệ).

    Dùng để chặn rác ở biên; KHÔNG dùng để so khớp (so khớp luôn dùng
    `normalize_phone`), tránh việc siết định dạng làm khoá mất tài khoản cũ.
    """
    p = normalize_phone(phone)
    return len(p) == 10 and p[0] == "0" and p[1] in _MOBILE_LEADS
