"""Vòng chăm sóc: nhắn → im lặng → họ hỏi → hướng dẫn → chốt."""
from datetime import datetime, timedelta

from daythem.adapters.orm import ActivityEventORM, ClassORM, StudentORM, TeacherORM
from daythem.service.cham_soc import (
    HUONG_DAN, IM_LANG_NGAY, KIND_BO, KIND_NHAN, KIND_XONG,
    dang_im_lang, ghi, huong_dan_cho, lich_su,
)
from daythem.service.user_health import user_list
from daythem.service.viec_hom_nay import viec_hom_nay


def _sf(db):
    return lambda: db


def _gv(db, phone="0908070463", ten="Cô Mai", lop=True, hs=0, aha=False):
    t = TeacherORM(id="t" + phone, phone=phone, name=ten,
                   created_at=datetime.utcnow() - timedelta(days=2))
    db.add(t); db.commit()
    if lop:
        c = ClassORM(id="c" + phone, teacher_id=t.id, name="Lớp 6", subject="Anh",
                     grade="6", default_fee=500000, fee_type="month")
        db.add(c); db.commit()
        for i in range(hs):
            db.add(StudentORM(id=f"s{phone}{i}", class_id=c.id, name=f"Bé {i}"))
        db.commit()
    if aha:
        db.add(ActivityEventORM(id="e" + phone, teacher_id=t.id,
                                kind="attendance_submitted", created_at=datetime.utcnow()))
        db.commit()
    return t


def _u(db, t):
    return next(x for x in user_list(_sf(db))["users"] if x.teacher_id == t.id)


def test_da_nhan_thi_ban_tin_khong_hien_lai(db):
    t = _gv(db)
    assert "Cô Mai" in viec_hom_nay(_sf(db))
    ghi(_sf(db), t.id, KIND_NHAN)
    assert "Cô Mai" not in viec_hom_nay(_sf(db))


def test_qua_han_im_lang_thi_hien_lai(db):
    """Nhắn rồi họ im luôn — sau 4 ngày phải nhắc lại, không bỏ rơi."""
    t = _gv(db)
    ghi(_sf(db), t.id, KIND_NHAN)
    row = db.query(type(db.query(TeacherORM).first()).__mro__[0]) if False else None
    from daythem.adapters.orm import OutreachORM
    o = db.query(OutreachORM).one()
    o.created_at = datetime.utcnow() - timedelta(days=IM_LANG_NGAY + 1)
    db.commit()
    assert "Cô Mai" in viec_hom_nay(_sf(db))


def test_chot_xong_thi_khong_bao_gio_hien_lai(db):
    t = _gv(db)
    ghi(_sf(db), t.id, KIND_XONG)
    from daythem.adapters.orm import OutreachORM
    o = db.query(OutreachORM).one()
    o.created_at = datetime.utcnow() - timedelta(days=90)
    db.commit()
    assert "Cô Mai" not in viec_hom_nay(_sf(db))


def test_bo_thi_cung_khong_hien_lai(db):
    t = _gv(db)
    ghi(_sf(db), t.id, KIND_BO)
    assert "Cô Mai" not in viec_hom_nay(_sf(db))


def test_huong_dan_khop_dung_diem_ket(db):
    chua_lop = _gv(db, "0900000001", "Cô A", lop=False)
    assert huong_dan_cho(_u(db, chua_lop))[0] == "tao_lop"
    chua_hs = _gv(db, "0900000002", "Cô B", hs=0)
    assert huong_dan_cho(_u(db, chua_hs))[0] == "them_hs"
    chua_dd = _gv(db, "0900000003", "Cô C", hs=5)
    assert huong_dan_cho(_u(db, chua_dd))[0] == "diem_danh"


def test_bai_huong_dan_lam_duoc_ngay_tren_dien_thoai(db):
    """Mỗi bài phải là các bước bấm cụ thể, không phải giải thích."""
    for khoa, bai in HUONG_DAN.items():
        assert "1." in bai and "2." in bai, f"{khoa} thiếu bước đánh số"
        assert len(bai) < 700, f"{khoa} dài quá, nhắn Zalo không ai đọc hết"


def test_nut_bam_kem_dung_id_giao_vien(db):
    t = _gv(db)
    text, markup = viec_hom_nay(_sf(db), kem_nut=True)
    nut = markup["inline_keyboard"][0]
    assert nut[0]["callback_data"] == f"n:{t.id}"
    assert nut[1]["callback_data"] == f"h:{t.id}"
    assert len(nut[0]["callback_data"].encode()) <= 64, "Telegram giới hạn 64 byte"


def test_khong_kem_nut_thi_van_tra_ve_chuoi(db):
    _gv(db)
    assert isinstance(viec_hom_nay(_sf(db)), str)


def test_ghi_lich_su_de_biet_da_lam_gi(db):
    t = _gv(db)
    ghi(_sf(db), t.id, KIND_NHAN)
    # Giãn mốc thời gian tường minh: hai lần ghi liên tiếp có thể rơi cùng một
    # tick đồng hồ → sắp xếp mới-trước thành ngẫu nhiên (đã flaky thật 01/09).
    from daythem.adapters.orm import OutreachORM
    o = db.query(OutreachORM).one()
    o.created_at = datetime.utcnow() - timedelta(minutes=1)
    db.commit()
    ghi(_sf(db), t.id, "huong", note="diem_danh")
    ls = lich_su(_sf(db), t.id)
    assert [x.kind for x in ls] == ["huong", "nhan"]
    assert ls[0].note == "diem_danh"


def test_ghi_hong_khong_lam_chet_bot(db):
    def sf_hong():
        raise RuntimeError("DB sập")
    assert ghi(sf_hong, "t1", KIND_NHAN) is False


def test_kind_la_khong_duoc_ghi(db):
    t = _gv(db)
    assert ghi(_sf(db), t.id, "linh tinh") is False
    assert dang_im_lang(_sf(db)) == set()
