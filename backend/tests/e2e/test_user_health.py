"""Theo dõi người dùng thật — loại đúng acc thử/seed, chẩn đúng điểm kẹt."""
from datetime import datetime, timedelta

import pytest

from daythem.adapters.orm import ActivityEventORM, ClassORM, StudentORM, TeacherORM
from daythem.service.user_health import (
    EXCLUDE_PHONES, EXCLUDE_RANGE, STAGES, digest_lines, is_real, user_list,
)


@pytest.fixture
def sf(db):
    return lambda: db


def _teacher(db, phone, name="Cô A", created=None):
    t = TeacherORM(id=f"t-{phone}", phone=phone, name=name,
                   created_at=created or datetime.utcnow() - timedelta(days=3))
    db.add(t); db.commit()
    return t


def _klass(db, t, cid="c1"):
    c = ClassORM(id=cid, teacher_id=t.id, name="Lớp 3", subject="Toán", grade="3",
                 default_fee=600000, fee_type="month")
    db.add(c); db.commit()
    return c


def _event(db, t, kind, when=None):
    db.add(ActivityEventORM(id=f"e-{kind}-{when or ''}-{id(kind)}", teacher_id=t.id,
                            kind=kind, created_at=when or datetime.utcnow()))
    db.commit()


def test_loai_acc_thu_va_seed_cua_owner(db):
    for p in list(EXCLUDE_PHONES)[:3]:
        assert not is_real(_teacher(db, p))


def test_loai_tester_doi_cheo_theo_khoang_ngay(db):
    giua = EXCLUDE_RANGE[0] + timedelta(days=1)
    assert not is_real(_teacher(db, "0900000001", created=giua))


def test_giu_lai_giao_vien_that(db):
    assert is_real(_teacher(db, "0908070463", "Cô Mai"))


def test_dang_ky_xong_khong_tao_lop_thi_bao_GOI_NGAY(sf, db):
    _teacher(db, "0908070463", "Cô Quỳnh")
    u = user_list(sf)["users"][0]
    assert u.classes == 0
    assert "chưa tạo lớp" in u.stuck
    assert "GỌI NGAY" in u.action, "kẹt ngay cửa đầu phải là mức khẩn nhất"


def test_co_lop_nhung_chua_co_hoc_sinh(sf, db):
    t = _teacher(db, "0908070463"); _klass(db, t)
    u = user_list(sf)["users"][0]
    assert u.stage == "tạo lớp"
    assert "chưa thêm học sinh" in u.stuck


def test_co_hoc_sinh_nhung_chua_cham_aha(sf, db):
    t = _teacher(db, "0908070463"); c = _klass(db, t)
    db.add(StudentORM(id="s1", class_id=c.id, name="Bé An")); db.commit()
    u = user_list(sf)["users"][0]
    assert u.stage == "thêm HS"
    assert "chưa làm hành động lõi" in u.stuck
    assert "aha" in u.action.lower()


def test_cham_aha_thi_stage_tien_va_het_ket(sf, db):
    t = _teacher(db, "0908070463"); c = _klass(db, t)
    db.add(StudentORM(id="s1", class_id=c.id, name="Bé An")); db.commit()
    _event(db, t, "attendance_submitted")
    _event(db, t, "tuition_paid")
    u = user_list(sf)["users"][0]
    assert u.stage == "thu phí"
    assert u.features.get("điểm danh") == 1 and u.features.get("thu phí") == 1


def test_dung_that_roi_bo_thi_canh_bao_im_lang(sf, db):
    t = _teacher(db, "0908070463", created=datetime.utcnow() - timedelta(days=30))
    c = _klass(db, t)
    db.add(StudentORM(id="s1", class_id=c.id, name="Bé An")); db.commit()
    _event(db, t, "attendance_submitted", datetime.utcnow() - timedelta(days=20))
    _event(db, t, "tuition_paid", datetime.utcnow() - timedelta(days=19))
    u = user_list(sf)["users"][0]
    assert "Im lặng" in u.stuck
    assert "mất mát lớn nhất" in u.action


def test_dem_ngay_dung_that_khong_dem_thao_tac(sf, db):
    """5 thao tác trong MỘT ngày không bằng 1 thao tác mỗi ngày trong 3 ngày."""
    t = _teacher(db, "0908070463"); c = _klass(db, t)
    db.add(StudentORM(id="s1", class_id=c.id, name="Bé An")); db.commit()
    base = datetime.utcnow() - timedelta(days=2)
    for i in range(5):
        _event(db, t, "tuition_paid", base + timedelta(minutes=i))
    u = user_list(sf)["users"][0]
    assert u.events == 5
    assert u.active_days == 2, "chỉ 2 ngày khác nhau (ngày tạo acc + ngày thao tác)"


def test_khoi_telegram_hien_ten_va_muc_can_goi(sf, db):
    _teacher(db, "0908070463", "Cô Quỳnh")
    text = "\n".join(digest_lines(sf))
    assert "NGƯỜI DÙNG THẬT" in text
    assert "Cô Quỳnh" in text
    assert "Cần gọi" in text


def test_khong_co_ai_that_thi_noi_thang(sf, db):
    for p in list(EXCLUDE_PHONES)[:2]:
        _teacher(db, p)
    text = "\n".join(digest_lines(sf))
    assert "Chưa có ai" in text


def test_stage_cua_user_luon_nam_trong_STAGES(sf, db):
    t = _teacher(db, "0908070463"); c = _klass(db, t)
    db.add(StudentORM(id="s1", class_id=c.id, name="Bé An")); db.commit()
    _event(db, t, "report_generated")
    u = user_list(sf)["users"][0]
    assert u.stage in [s[0] for s in STAGES]
