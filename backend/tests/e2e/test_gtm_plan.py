"""Kế hoạch GTM — một danh sách duy nhất, CÓ TRẠNG THÁI để traceback được."""
import pytest

from daythem.service.gtm_plan import (
    PLAN, PLAN_BY_KEY, digest_lines, mark, next_tasks, progress,
    recently_done, seed_tasks,
)


@pytest.fixture
def sf(db):
    """session_factory dùng chung session của test."""
    return lambda: db


def test_moi_viec_deu_co_ly_do_va_nguon(sf):
    """Việc không nói được 'làm xong mở khoá gì' thì chưa đáng nằm trong kế hoạch."""
    for p in PLAN:
        assert p.why, f"{p.key} thiếu lý do"
        assert p.source, f"{p.key} thiếu nguồn để lần ngược"
        assert p.owner in ("anh", "claude")


def test_ma_viec_khong_trung(sf):
    keys = [p.key for p in PLAN]
    assert len(keys) == len(set(keys)), "mã việc bị trùng — gieo vào DB sẽ vỡ"


def test_gieo_lai_khong_tao_trung(sf):
    a = seed_tasks(sf)
    b = seed_tasks(sf)
    assert a["added"] == len(PLAN)
    assert b["added"] == 0, "gieo lần hai không được thêm việc mới"
    assert b["updated"] == len(PLAN)


def test_gieo_lai_giu_nguyen_tien_do(sf):
    """Sửa câu chữ trong kế hoạch KHÔNG được làm mất tiến độ đã ghi."""
    seed_tasks(sf)
    mark(sf, "ios-submit", "done")
    seed_tasks(sf)
    assert not any(t.key == "ios-submit" for t in next_tasks(sf, 99)), \
        "gieo lại làm việc đã xong quay về chưa làm"


def test_thu_tu_dung_thu_tu_trong_ke_hoach(sf):
    seed_tasks(sf)
    got = [t.key for t in next_tasks(sf, 3)]
    assert got == [p.key for p in PLAN[:3]]


def test_xong_thi_bien_khoi_danh_sach_tiep_theo(sf):
    seed_tasks(sf)
    first = PLAN[0].key
    mark(sf, first, "done")
    assert first not in [t.key for t in next_tasks(sf, 3)]
    assert first in [t.key for t in recently_done(sf, 24)]


def test_bo_qua_cung_bien_khoi_danh_sach(sf):
    seed_tasks(sf)
    mark(sf, "zalo-oa", "skip", "để sau")
    assert "zalo-oa" not in [t.key for t in next_tasks(sf, 99)]


def test_trang_thai_la_bo_khong_nhan(sf):
    seed_tasks(sf)
    with pytest.raises(ValueError):
        mark(sf, "ios-submit", "hoan-thanh")


def test_ma_viec_khong_ton_tai_thi_bao_loi(sf):
    seed_tasks(sf)
    with pytest.raises(ValueError):
        mark(sf, "khong-co-viec-nay", "done")


def test_viec_lap_khong_tinh_vao_tien_do(sf):
    """seeding-daily làm mỗi ngày, không bao giờ 'xong' — đếm vào là sai tiến độ."""
    seed_tasks(sf)
    pg = progress(sf)
    lap = sum(1 for p in PLAN if p.repeats)
    assert pg["total"] == len(PLAN) - lap
    assert lap > 0, "phải có ít nhất một việc lặp, nếu không test này vô nghĩa"


def test_khoi_telegram_co_viec_va_ly_do(sf):
    seed_tasks(sf)
    text = "\n".join(digest_lines(sf))
    assert "VIỆC HÔM NAY" in text
    assert PLAN[0].title in text
    assert PLAN[0].why in text, "thiếu lý do thì đọc xong vẫn không biết vì sao phải làm"


def test_khoi_telegram_hien_viec_vua_xong(sf):
    seed_tasks(sf)
    mark(sf, PLAN[0].key, "done")
    assert "Vừa xong" in "\n".join(digest_lines(sf))


def test_chi_hien_3_viec(sf):
    """Đưa 13 việc mỗi sáng là quay lại đúng vấn đề quá tải.

    Chỉ đếm trong khối 'VIỆC HÔM NAY' — mục 'Vừa xong' bên dưới là traceback,
    không phải việc phải làm, nên không tính.
    """
    seed_tasks(sf)
    text = "\n".join(digest_lines(sf))
    phai_lam = text.split("Vừa xong")[0]
    hien = sum(1 for p in PLAN if p.title in phai_lam)
    assert hien <= 3, f"khối việc hôm nay hiện {hien} việc — quá nhiều"
