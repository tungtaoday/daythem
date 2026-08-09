"""Vòng growth: ghi thử nghiệm rẻ nhất có thể, bảng điểm tất định."""
import pytest

from daythem.service.growth_loop import (
    CHANNELS, PILLARS, log_post, scoreboard, set_last_post_metrics,
)


@pytest.fixture
def sf(db):
    return lambda: db


def test_kenh_g1_g5_khop_thu_tu_ban_tin(sf):
    """g1..g5 phải trỏ đúng nhóm theo thứ tự GROUPS — lệch là ghi nhầm kênh."""
    from daythem.service.seeding import GROUPS
    for i, g in enumerate(GROUPS):
        assert CHANNELS[f"g{i+1}"] == g.name


def test_ghi_bai_roi_thay_tren_bang_diem(sf):
    log_post(sf, "g1", "hocphi", link_code="gp1")
    sb = scoreboard(sf)
    assert sb["posts"] == 1
    text = "\n".join(sb["lines"])
    assert CHANNELS["g1"] in text and PILLARS["hocphi"] in text


def test_kenh_sai_bao_loi_kem_danh_sach(sf):
    with pytest.raises(ValueError, match="g1"):
        log_post(sf, "g99", "hocphi")


def test_tru_sai_bao_loi_kem_danh_sach(sf):
    with pytest.raises(ValueError, match="hocphi"):
        log_post(sf, "g1", "khong-co")


def test_kq_ap_cho_bai_gan_nhat(sf):
    log_post(sf, "g1", "hocphi")
    log_post(sf, "fb", "gioithieu")
    r = set_last_post_metrics(sf, 1200, 14, 3)
    assert r["channel"] == CHANNELS["fb"], "phải cập nhật bài GẦN NHẤT"
    assert r["reach"] == 1200


def test_kq_khi_chua_co_bai_thi_chi_duong(sf):
    with pytest.raises(ValueError, match="/post"):
        set_last_post_metrics(sf, 1, 1, 1)


def test_khoi_dan_cho_claude_tat_dinh_va_du_ngu_canh(sf):
    log_post(sf, "g1", "hocphi", link_code="gp1")
    set_last_post_metrics(sf, 500, 5, 1)
    a = scoreboard(sf)["claude_block"]
    b = scoreboard(sf)["claude_block"]
    assert a == b, "khối cho Claude phải tất định — chạy hai lần ra y hệt"
    for can_co in ["WAT=", PILLARS["hocphi"], "reach=500", "Đăng ký theo nguồn",
                   "TỐI ĐA 3 điều chỉnh"]:
        assert can_co in a or can_co.lower() in a.lower(), f"thiếu {can_co!r}"


def test_bang_diem_rong_van_chay_va_nhac_post(sf):
    sb = scoreboard(sf)
    assert sb["posts"] == 0
    assert "/post" in "\n".join(sb["lines"]), "rỗng phải chỉ cách bắt đầu"


def test_bao_cao_tuan_gom_bang_diem(sf):
    from daythem.service.weekly_report import build_weekly_report
    log_post(sf, "g1", "thongtu29")
    text = build_weekly_report(sf)["text"]
    assert "BẢNG ĐIỂM THỬ NGHIỆM" in text
    assert "Khối dán cho Claude" in text
