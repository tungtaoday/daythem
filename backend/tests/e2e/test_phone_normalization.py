"""Chuẩn hoá SĐT — chặn lỗi 'đăng nhập lại thành tài khoản trắng, mất hết lớp'.

BR: SĐT là danh tính của GV. Mọi cách viết của cùng một số phải ra cùng một tài khoản.
"""
import pytest

from daythem.phone import normalize_phone, is_valid_vn_mobile


# ── Hàm chuẩn hoá ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("raw,expected", [
    # dạng chuẩn giữ nguyên
    ("0905550002", "0905550002"),
    # khoảng trắng, dấu phân cách
    (" 0905550002 ", "0905550002"),
    ("0905 550 002", "0905550002"),
    ("090.555.0002", "0905550002"),
    ("090-555-0002", "0905550002"),
    ("(090) 555 0002", "0905550002"),
    # mã quốc gia
    ("+84905550002", "0905550002"),
    ("+84 905 550 002", "0905550002"),
    ("84905550002", "0905550002"),
    ("0084905550002", "0905550002"),
    # Excel nuốt số 0 đứng đầu
    ("905550002", "0905550002"),
    ("354445566", "0354445566"),
    # rỗng
    ("", ""),
    (None, ""),
])
def test_normalize(raw, expected):
    assert normalize_phone(raw) == expected


def test_084_la_so_vinaphone_that_khong_bi_cat_nham():
    """`084xxxxxxx` (10 số) là đầu số Vinaphone hợp lệ — KHÔNG được hiểu là mã
    quốc gia 84 rồi cắt mất. Phân biệt bằng độ dài."""
    assert normalize_phone("0842223344") == "0842223344"


def test_khong_gop_nham_hai_nguoi_khac_nhau():
    """Gộp nhầm hai người vào một tài khoản còn tệ hơn tách nhầm một người."""
    assert normalize_phone("0905550002") != normalize_phone("0905550003")


@pytest.mark.parametrize("phone,ok", [
    ("0905550002", True),
    ("+84905550002", True),
    ("0123456789", False),   # đầu số 01 không còn dùng
    ("090555", False),       # quá ngắn
    ("khong-phai-so", False),
])
def test_is_valid_vn_mobile(phone, ok):
    assert is_valid_vn_mobile(phone) is ok


# ── Kịch bản thật qua API ────────────────────────────────────────────────────

PW = "matkhau123"


def test_dang_nhap_lai_bang_dinh_dang_khac_van_dung_tai_khoan_cu(client):
    """Cô Lan đăng ký bằng 0905..., sau đổi máy đăng nhập bằng +84905...
    → PHẢI vào đúng tài khoản cũ, không được đẻ tài khoản trắng."""
    r1 = client.post("/api/v1/auth/login",
                     json={"phone": "0912000111", "password": PW})
    assert r1.status_code == 200
    id_goc = r1.json()["teacher"]["id"]

    for cach_viet in ["+84912000111", "84912000111", " 0912000111 ",
                      "0912 000 111", "912000111"]:
        r = client.post("/api/v1/auth/login",
                        json={"phone": cach_viet, "password": PW})
        assert r.status_code == 200, f"{cach_viet} → {r.text}"
        assert r.json()["teacher"]["id"] == id_goc, (
            f"{cach_viet} tạo tài khoản KHÁC → giáo viên mất hết dữ liệu")


def test_so_luu_trong_db_luon_o_dang_chuan(client):
    """Dù đăng ký bằng dạng nào, DB chỉ lưu một dạng duy nhất."""
    r = client.post("/api/v1/auth/login",
                    json={"phone": "+84987654321", "password": PW})
    assert r.status_code == 200
    assert r.json()["teacher"]["phone"] == "0987654321"


def test_check_phone_va_login_tra_ve_cung_ket_qua(client):
    """Trước đây check-phone có .strip() còn login thì không → hai đường
    nói hai kết quả khác nhau cho cùng một số."""
    client.post("/api/v1/auth/login",
                json={"phone": "0933444555", "password": PW})

    for cach_viet in ["0933444555", "+84933444555", " 0933444555"]:
        r = client.post("/api/v1/auth/check-phone", json={"phone": cach_viet})
        assert r.json()["exists"] is True, f"{cach_viet} → báo chưa có tài khoản"


def test_rate_limit_khong_lach_duoc_bang_cach_doi_dinh_dang(client):
    """Khoá rate-limit dùng SĐT đã chuẩn hoá → đổi cách viết không cấp bộ đếm mới,
    nếu không kẻ dò mật khẩu vượt được giới hạn 10 lần/5 phút."""
    from daythem.entrypoints import ratelimit
    from daythem.entrypoints.ratelimit import _HITS
    ratelimit.reset()

    client.post("/api/v1/auth/login", json={"phone": "0966777888", "password": PW})

    khoa = [k for k in _HITS if k.startswith("login_phone")]
    for cach_viet in ["+84966777888", "0966 777 888", "966777888"]:
        client.post("/api/v1/auth/login",
                    json={"phone": cach_viet, "password": "sai-mat-khau"})

    khoa_sau = [k for k in _HITS if k.startswith("login_phone")]
    assert len(khoa_sau) == len(khoa), (
        f"Mỗi cách viết đẻ ra một bộ đếm riêng → lách được rate limit: {khoa_sau}")


def test_request_otp_chan_so_sai_dinh_dang(client):
    """Khi nối SMS thật, gửi vào số rác là mất tiền mà không ai nhận."""
    for so_rac in ["0123456789", "090555", "khong-phai-so", "12345678901234"]:
        r = client.post("/api/v1/auth/request-otp", json={"phone": so_rac})
        assert r.status_code == 422, f"{so_rac} lọt qua → {r.status_code}"

    r = client.post("/api/v1/auth/request-otp", json={"phone": "+84905550002"})
    assert r.status_code == 200, "số hợp lệ viết kiểu quốc tế bị chặn nhầm"
