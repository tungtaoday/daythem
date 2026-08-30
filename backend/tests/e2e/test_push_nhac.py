"""Push nhắc buổi dạy: đúng người, đúng giờ, không dội, tôn trọng cài đặt."""
from datetime import datetime, timedelta, timezone

from daythem.adapters.orm import ClassORM, NotifEventORM, TeacherORM
from daythem.service.push_nhac import nhac_buoi_day

_VN = timezone(timedelta(hours=7))
# Thứ 4 (isoweekday=3) 15:00 VN — trong giờ cho phép
NOW = datetime(2026, 8, 26, 15, 0, tzinfo=_VN)


def _sf(db):
    return lambda: db


def _gv(db, phone="0908070463", token="ExponentPushToken[abc]", **kw):
    t = TeacherORM(id="t" + phone, phone=phone, name="Cô Mai", push_token=token,
                   created_at=datetime.utcnow(), **kw)
    db.add(t); db.commit()
    return t


def _lop(db, t, start="16:30", days=None, cid="c1", archived=False):
    c = ClassORM(id=cid, teacher_id=t.id, name="Toán 8", subject="Toán", grade="8",
                 default_fee=0, fee_type="month", archived=archived,
                 schedule={"days": days or [3], "day": (days or [3])[0], "start_time": start})
    db.add(c); db.commit()
    return c


class GhiLai:
    def __init__(self, ok=True):
        self.goi = []
        self.ok = ok

    def __call__(self, token, title, body):
        self.goi.append((token, title, body))
        return self.ok


def test_gui_dung_buoi_sap_dien_ra(db):
    t = _gv(db); _lop(db, t, start="16:30")          # 90 phút nữa
    g = GhiLai()
    kq = nhac_buoi_day(_sf(db), now=NOW, sender=g)
    assert kq["gui"] == 1
    token, title, body = g.goi[0]
    assert token == t.push_token
    assert "Toán 8" in title and "16:30" in title
    assert "điểm danh" in body


def test_khong_goi_hai_lan_cung_buoi(db):
    t = _gv(db); _lop(db, t)
    g = GhiLai()
    nhac_buoi_day(_sf(db), now=NOW, sender=g)
    nhac_buoi_day(_sf(db), now=NOW + timedelta(minutes=60), sender=g)
    assert len(g.goi) == 1, "cron chạy giờ sau phải bị dedupe"


def test_buoi_da_qua_hoac_con_xa_thi_khong_nhac(db):
    t = _gv(db)
    _lop(db, t, start="14:00", cid="c-qua")          # đã qua 1 tiếng
    _lop(db, t, start="20:00", cid="c-xa")           # còn 5 tiếng
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_sai_thu_thi_khong_nhac(db):
    t = _gv(db); _lop(db, t, days=[6])               # lớp thứ 7, nay thứ 4
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_tat_thong_bao_diem_danh_thi_im(db):
    t = _gv(db, notif_attendance=False); _lop(db, t)
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_khong_token_thi_im(db):
    t = _gv(db, token=None); _lop(db, t)
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_dnd_thi_im(db):
    t = _gv(db, dnd_start="14:00", dnd_end="17:00"); _lop(db, t)
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_dem_khuya_khong_gui_bat_ke_cau_hinh(db):
    t = _gv(db); _lop(db, t, start="23:30")
    g = GhiLai()
    kq = nhac_buoi_day(_sf(db), now=NOW.replace(hour=23), sender=g)
    assert kq["gui"] == 0 and "ngoai gio cho phep" in kq["bo_qua"]


def test_lop_luu_tru_khong_nhac(db):
    t = _gv(db); _lop(db, t, archived=True)
    g = GhiLai()
    assert nhac_buoi_day(_sf(db), now=NOW, sender=g)["gui"] == 0


def test_gui_hong_thi_khong_ghi_so_de_gio_sau_thu_lai(db):
    """Expo lỗi tạm → không ghi notif_events → cron giờ sau tự thử lại."""
    t = _gv(db); _lop(db, t)
    nhac_buoi_day(_sf(db), now=NOW, sender=GhiLai(ok=False))
    assert db.query(NotifEventORM).count() == 0
    g2 = GhiLai(ok=True)
    nhac_buoi_day(_sf(db), now=NOW + timedelta(minutes=30), sender=g2)
    assert len(g2.goi) == 1


def test_tran_3_push_mot_ngay(db):
    t = _gv(db)
    for i in range(5):
        _lop(db, t, start="16:30", cid=f"c{i}")
    g = GhiLai()
    kq = nhac_buoi_day(_sf(db), now=NOW, sender=g)
    assert kq["gui"] == 3, "toi da 3 push/GV/ngay — chong doi bom thong bao"


def test_ghi_notif_events_lam_nen_chong_met_moi(db):
    t = _gv(db); _lop(db, t)
    nhac_buoi_day(_sf(db), now=NOW, sender=GhiLai())
    e = db.query(NotifEventORM).one()
    assert e.channel == "utility" and e.event_type == "delivered"
    assert e.rule.startswith("nb:") and len(e.rule) <= 40
