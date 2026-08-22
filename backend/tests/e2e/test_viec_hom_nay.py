"""Bản tin sáng: đúng người, đúng thứ tự, và tin nhắn khớp điểm kẹt."""
from datetime import datetime, timedelta

from daythem.adapters.orm import ActivityEventORM, ClassORM, StudentORM, TeacherORM
from daythem.service.viec_hom_nay import viec_hom_nay


def _sf(db):
    return lambda: db


def _gv(db, phone, ten, ngay_truoc=1):
    t = TeacherORM(id=f"t{phone}", phone=phone, name=ten,
                   created_at=datetime.utcnow() - timedelta(days=ngay_truoc))
    db.add(t); db.commit()
    return t


def _lop(db, t, cid):
    c = ClassORM(id=cid, teacher_id=t.id, name="Lớp 6", subject="Anh", grade="6",
                 default_fee=500000, fee_type="month")
    db.add(c); db.commit()
    return c


def _hs(db, c, n):
    for i in range(n):
        db.add(StudentORM(id=f"s{c.id}{i}", class_id=c.id, name=f"Bé {i}"))
    db.commit()


def test_chua_tao_lop_thi_tin_nhan_moi_tao_lop(db):
    _gv(db, "0908070463", "Cô Hương")
    out = viec_hom_nay(_sf(db))
    assert "Cô Hương" in out
    assert "chưa tạo lớp" in out
    assert "tạo lớp đầu tiên" in out


def test_co_lop_chua_co_hs_thi_tin_nhan_moi_them_hs(db):
    t = _gv(db, "0908070463", "Cô Mai"); _lop(db, t, "c1")
    out = viec_hom_nay(_sf(db))
    assert "thêm học sinh" in out.lower()
    assert "chụp ảnh gửi em" in out


def test_da_nhap_nhieu_hs_ma_chua_diem_danh_thi_moi_diem_danh(db):
    t = _gv(db, "0908070463", "Ms Meila")
    c = _lop(db, t, "c1"); _hs(db, c, 30)
    out = viec_hom_nay(_sf(db))
    assert "đã nhập 30 em" in out
    assert "điểm danh" in out


def test_nguoi_bo_nhieu_cong_suc_duoc_goi_TRUOC(db):
    """30 học sinh nhập tay rồi dừng = mất mát lớn hơn người mới bấm 1 phút."""
    _gv(db, "0900000001", "Cô Ít")                       # chưa tạo lớp
    t2 = _gv(db, "0900000002", "Cô Nhiều")
    c = _lop(db, t2, "c2"); _hs(db, c, 30)
    out = viec_hom_nay(_sf(db))
    assert out.index("Cô Nhiều") < out.index("Cô Ít")


def test_ban_tin_NGAN_khong_phai_bang_chi_so(db):
    """Bản tin cũ ~40 dòng chỉ số. Cái này phải gọn để đọc trên điện thoại."""
    for i in range(3):
        _gv(db, f"090800046{i}", f"Cô {i}")
    out = viec_hom_nay(_sf(db))
    assert len(out.splitlines()) < 26, "dài quá thì lại thành bảng chỉ số như cũ"


def test_khong_ai_ket_thi_noi_thang_khong_bia_viec(db):
    t = _gv(db, "0908070463", "Cô Ổn", ngay_truoc=2)
    c = _lop(db, t, "c1"); _hs(db, c, 5)
    for k in ("attendance_submitted", "tuition_paid", "report_generated"):
        db.add(ActivityEventORM(id=f"e{k}", teacher_id=t.id, kind=k,
                                created_at=datetime.utcnow()))
    db.commit()
    out = viec_hom_nay(_sf(db))
    assert "không ai đang kẹt" in out


def test_co_bai_thi_kem_bai_va_link_group(db):
    _gv(db, "0908070463", "Cô A")
    out = viec_hom_nay(_sf(db), bai_hom_nay="Nội dung bài đăng hôm nay",
                       link_group="https://facebook.com/groups/abc")
    assert "ĐĂNG HÔM NAY" in out
    assert "Nội dung bài đăng hôm nay" in out
    assert "facebook.com/groups/abc" in out


def test_khong_co_bai_thi_khong_hien_khoi_dang(db):
    _gv(db, "0908070463", "Cô A")
    assert "ĐĂNG HÔM NAY" not in viec_hom_nay(_sf(db))


def test_tin_nhan_boc_duoc_de_copy(db):
    """Tin nhắn phải nằm trong <code> — Telegram cho chạm là copy cả khối."""
    _gv(db, "0908070463", "Cô Hương")
    out = viec_hom_nay(_sf(db))
    assert out.count("<code>") >= 1 and out.count("</code>") == out.count("<code>")
