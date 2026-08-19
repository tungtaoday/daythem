"""Bước chân của GV — ghép phiên đúng, chặn rác, và không làm bẩn phễu cũ."""
import re
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from daythem.adapters.orm import ActivityEventORM, TeacherORM, UiEventORM
from daythem.service.activity import activation_funnel
from daythem.service.journey import (
    KNOWN_SCREENS, MAX_BATCH, digest_lines, drop_off, record_steps, sessions_of,
)


def _teacher(db, phone="0908070463"):
    t = TeacherORM(id="t1", phone=phone, name="Cô Mai", created_at=datetime.utcnow())
    db.add(t); db.commit()
    return t


def _sf(db):
    return lambda: db


def test_ghi_duoc_lo_buoc_chan(db):
    t = _teacher(db)
    n = record_steps(_sf(db), t.id, [
        {"screen": "Home", "session_id": "s1"},
        {"screen": "Classes", "action": "bấm tạo lớp", "session_id": "s1"},
    ], platform="android", app_version="1.0.0")
    assert n == 2
    assert db.query(UiEventORM).count() == 2


def test_bo_qua_man_hinh_la(db):
    """Client lỗi hoặc ai đó gọi tay API không được bơm rác vào bảng."""
    t = _teacher(db)
    n = record_steps(_sf(db), t.id, [
        {"screen": "Home"},
        {"screen": "<script>alert(1)</script>"},
        {"screen": "KhongTonTai"},
    ])
    assert n == 1
    assert db.query(UiEventORM).one().screen == "Home"


def test_chan_lo_qua_lon(db):
    t = _teacher(db)
    n = record_steps(_sf(db), t.id, [{"screen": "Home"}] * (MAX_BATCH + 30))
    assert n == MAX_BATCH


def test_khong_bao_gio_nem_loi_ra_ngoai(db):
    """Đo đạc hỏng thì im lặng — tuyệt đối không được làm chết thao tác của GV."""
    def sf_hong():
        raise RuntimeError("DB sập")
    assert record_steps(sf_hong, "t1", [{"screen": "Home"}]) == 0


def test_khong_lam_ban_phieu_kich_hoat(db):
    """ui_events tách riêng — phễu cũ phải không đổi dù đổ bao nhiêu bước chân."""
    t = _teacher(db)
    truoc = activation_funnel(_sf(db))
    record_steps(_sf(db), t.id, [{"screen": "Home"}] * 20)
    assert activation_funnel(_sf(db)) == truoc
    assert db.query(ActivityEventORM).count() == 0


def test_ghep_phien_theo_thu_tu_thoi_gian(db):
    t = _teacher(db)
    base = datetime.utcnow()
    record_steps(_sf(db), t.id, [
        {"screen": "Home", "session_id": "s1", "at": base.isoformat()},
        {"screen": "Classes", "session_id": "s1", "at": (base + timedelta(seconds=5)).isoformat()},
        {"screen": "ClassDetail", "action": "mở lớp", "session_id": "s1",
         "at": (base + timedelta(seconds=9)).isoformat()},
    ])
    ss = sessions_of(_sf(db), t.id)
    assert len(ss) == 1
    assert ss[0].steps == ["Home", "Classes", "ClassDetail · mở lớp"]
    assert ss[0].seconds == 9
    assert ss[0].actions == 1


def test_gop_lan_mo_lai_cung_man_lien_tiep(db):
    t = _teacher(db)
    record_steps(_sf(db), t.id, [
        {"screen": "Home", "session_id": "s1"},
        {"screen": "Home", "session_id": "s1"},
        {"screen": "Classes", "session_id": "s1"},
    ])
    assert sessions_of(_sf(db), t.id)[0].steps == ["Home", "Classes"]


def test_phien_khong_bam_gi_bi_danh_dau_lac_duong(db):
    t = _teacher(db)
    record_steps(_sf(db), t.id, [
        {"screen": "Home", "session_id": "s1"}, {"screen": "Classes", "session_id": "s1"},
    ])
    assert sessions_of(_sf(db), t.id)[0].bounced is True


def test_phien_co_bam_thi_khong_lac_duong(db):
    t = _teacher(db)
    record_steps(_sf(db), t.id, [
        {"screen": "Home", "session_id": "s1"},
        {"screen": "Classes", "action": "bấm tạo lớp", "session_id": "s1"},
    ])
    assert sessions_of(_sf(db), t.id)[0].bounced is False


def test_diem_dung_cuoi_la_noi_nguoi_ta_bo_di(db):
    """Câu hỏi đáng tiền: màn nào người ta nhìn xong rồi thoát."""
    t = _teacher(db)
    for i in range(3):                       # 3 phiên đều chết ở Setup
        record_steps(_sf(db), t.id, [
            {"screen": "Home", "session_id": f"s{i}"},
            {"screen": "Setup", "session_id": f"s{i}"},
        ])
    rows = drop_off(_sf(db))
    assert rows[0]["screen"] == "Setup"
    assert rows[0]["ends"] == 3
    assert rows[0]["end_rate"] == 100


def test_ban_tin_canh_bao_ngo_cut(db):
    t = _teacher(db)
    for i in range(4):
        record_steps(_sf(db), t.id, [
            {"screen": "Home", "session_id": f"s{i}"},
            {"screen": "Setup", "session_id": f"s{i}"},
        ])
    text = "\n".join(digest_lines(_sf(db)))
    assert "Setup" in text and "ngõ cụt" in text


def test_chua_co_du_lieu_thi_noi_thang(db):
    assert "chưa có dữ liệu" in "\n".join(digest_lines(_sf(db)))


def test_khop_tuyet_doi_voi_ten_route_that_trong_app():
    """Quên khai một màn = bước chân ở đó bị nuốt IM LẶNG — bẫy khó thấy nhất,
    vì báo cáo vẫn chạy và chỉ trông như màn đó không ai vào.

    Đọc thẳng file navigation của app thay vì chép tay danh sách: chép tay chính
    là cách lỗi này đã xảy ra một lần (thiếu 9 màn).
    """
    nav = Path(__file__).resolve().parents[3] / "mobile" / "src" / "navigation" / "index.tsx"
    if not nav.exists():
        pytest.skip("không có mã mobile cạnh backend")
    names = set(re.findall(r'<(?:Stack|Tab)\.Screen\s+name="([A-Za-z]+)"', nav.read_text(encoding="utf-8")))
    assert names, "không đọc được tên route nào — regex hỏng, đừng để test xanh giả"
    thieu = sorted(names - KNOWN_SCREENS)
    assert not thieu, f"KNOWN_SCREENS thiếu {thieu} → bước chân ở các màn này bị bỏ"
