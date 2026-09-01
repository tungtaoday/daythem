"""E2E cho BUC-UNIFIED-ADMIN-OPERATIONS — hệ admin thống nhất.

Phủ: AC1 (tổng quan), AC2 (CRM một sổ hai cửa), AC4 (phễu nguồn), AC6 (bền vững
từng khu), BR2 (xếp theo mất mát), BR3 (im lặng rồi tự nổi lại), BR5 (dấu chân
đầu tiên), BR7 (rỗng thì nói thẳng). Viết TRƯỚC implement (Stage 3 → Stage 4).
"""
from datetime import datetime, timedelta

import pytest

from daythem.adapters.orm import ActivityEventORM, ClassORM, OutreachORM, StudentORM, TeacherORM


def _admin(client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    tok = client.post("/admin/login", json={"password": "owner-secret"}).json()["token"]
    return {"Authorization": f"Bearer {tok}"}


def _gv(db, phone, ten, lop=0, hs=0, aha=False, source=None, ngay_truoc=2):
    t = TeacherORM(id="t" + phone, phone=phone, name=ten, source=source,
                   created_at=datetime.utcnow() - timedelta(days=ngay_truoc))
    db.add(t); db.commit()
    for i in range(lop):
        c = ClassORM(id=f"c{phone}{i}", teacher_id=t.id, name=f"Lớp {i}", subject="Toán",
                     grade="9", default_fee=0, fee_type="month")
        db.add(c); db.commit()
        for j in range(hs):
            db.add(StudentORM(id=f"s{phone}{i}{j}", class_id=c.id, name=f"Bé {j}"))
        db.commit()
    if aha:
        db.add(ActivityEventORM(id="e" + phone, teacher_id=t.id,
                                kind="attendance_submitted", created_at=datetime.utcnow()))
        db.commit()
    return t


class TestOverview:
    """AC1 — khu Tổng quan."""

    def test_overview_main_flow(self, auth_client, db, monkeypatch):
        """Main flow: đủ 5 chỉ số hành động, tính đúng từ dữ liệu nền.

        Asserts: AC1, BR4
        """
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        _gv(db, "0911000001", "Cô Kẹt", lop=1)                    # kẹt → chờ chăm sóc
        _gv(db, "0911000002", "Cô Khoẻ", lop=1, hs=3, aha=True)   # đang dùng đều

        r = client.get("/admin/suite/overview", headers=h)
        assert r.status_code == 200
        d = r.json()
        assert d["gv_that"] >= 2
        assert d["dang_dung_deu"] >= 1
        assert len(d["dang_ky_7_ngay"]) == 7
        assert d["cho_cham_soc"] >= 1
        assert isinstance(d["viec_ke_tiep"], int)
        assert d["yen_ang"] is False

    def test_overview_ngay_yen_ang(self, auth_client, monkeypatch):
        """AF3: không dữ liệu → yen_ang=True, không bịa số. Asserts: BR7."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        d = client.get("/admin/suite/overview", headers=h).json()
        assert d["yen_ang"] is True
        assert d["cho_cham_soc"] == 0


class TestCrmQueue:
    """AC2 + BR2 + BR3 — hàng đợi CRM, cùng sổ với Telegram."""

    def test_crm_queue_main_flow(self, auth_client, db, monkeypatch):
        """Main flow: người kẹt xếp theo MẤT MÁT, kèm chẩn đoán + tin soạn sẵn.

        Asserts: AC2, BR2 (nhập 20 HS đứng trước người mới bấm 1 phút)
        """
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        _gv(db, "0911000001", "Cô Ít", lop=0)               # chưa tạo lớp
        _gv(db, "0911000002", "Cô Nhiều", lop=1, hs=20)     # bỏ nhiều công sức, kẹt

        rows = client.get("/admin/suite/crm", headers=h).json()["items"]
        tens = [x["ten"] for x in rows]
        assert tens.index("Cô Nhiều") < tens.index("Cô Ít")
        top = rows[tens.index("Cô Nhiều")]
        assert top["chan_doan"] and top["tin_soan_san"]
        assert "Cô Nhiều" in top["tin_soan_san"]

    @pytest.mark.parametrize("kind", [
        pytest.param("nhan", id="br3:da-nhan-thi-an"),
        pytest.param("huong", id="br3:da-gui-huong-dan-thi-an"),
        pytest.param("xong", id="br3:chot-xong-an-han"),
        pytest.param("bo", id="br3:bo-theo-doi-an-han"),
    ])
    def test_crm_act_hides_from_queue(self, auth_client, db, monkeypatch, kind):
        """BR3: mọi hành động chăm sóc đều đưa người đó ra khỏi hàng đợi ngay."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        t = _gv(db, "0911000001", "Cô Kẹt", lop=1)

        r = client.post("/admin/suite/crm/act", headers=h,
                        json={"teacher_id": t.id, "kind": kind})
        assert r.status_code == 200 and r.json()["ok"] is True
        tens = [x["ten"] for x in client.get("/admin/suite/crm", headers=h).json()["items"]]
        assert "Cô Kẹt" not in tens

    def test_crm_qua_han_im_lang_tu_noi_lai(self, auth_client, db, monkeypatch):
        """BR3 vế hai: nhắn rồi họ im — quá khung im lặng phải TỰ hiện lại."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        t = _gv(db, "0911000001", "Cô Kẹt", lop=1)
        client.post("/admin/suite/crm/act", headers=h, json={"teacher_id": t.id, "kind": "nhan"})

        from daythem.service.cham_soc import IM_LANG_NGAY
        o = db.query(OutreachORM).one()
        o.created_at = datetime.utcnow() - timedelta(days=IM_LANG_NGAY + 1)
        db.commit()
        tens = [x["ten"] for x in client.get("/admin/suite/crm", headers=h).json()["items"]]
        assert "Cô Kẹt" in tens

    def test_crm_act_ghi_lap_vo_hai(self, auth_client, db, monkeypatch):
        """EF2: bấm đúp (mạng chậm) không làm hàng đợi/trạng thái sai khác."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        t = _gv(db, "0911000001", "Cô Kẹt", lop=1)
        body = {"teacher_id": t.id, "kind": "nhan"}
        client.post("/admin/suite/crm/act", headers=h, json=body)
        truoc = client.get("/admin/suite/crm", headers=h).json()
        client.post("/admin/suite/crm/act", headers=h, json=body)   # bấm đúp
        sau = client.get("/admin/suite/crm", headers=h).json()
        assert truoc["items"] == sau["items"]

    def test_crm_mot_so_hai_cua(self, auth_client, db, monkeypatch):
        """BR1: ghi qua nghiệp vụ Telegram (cham_soc.ghi) → admin thấy y hệt."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        t = _gv(db, "0911000001", "Cô Kẹt", lop=1)
        from daythem.service.cham_soc import KIND_NHAN, ghi
        ghi(lambda: db, t.id, KIND_NHAN)                     # cửa Telegram
        tens = [x["ten"] for x in client.get("/admin/suite/crm", headers=h).json()["items"]]
        assert "Cô Kẹt" not in tens                           # cửa admin cùng sổ


class TestAttribution:
    """AC4 + BR5 — phễu theo nguồn tự khai."""

    def test_attribution_main_flow(self, auth_client, db, monkeypatch):
        """Main flow: mỗi nguồn một dòng phễu đăng ký → tạo lớp → kích hoạt.

        Asserts: AC4, BR5
        """
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        _gv(db, "0911000001", "Ads Kích Hoạt", lop=1, hs=2, aha=True, source="fb_ads")
        _gv(db, "0911000002", "Ads Mới", lop=0, source="fb_ads")
        _gv(db, "0911000003", "Group Tạo Lớp", lop=1, source="fb_group")
        _gv(db, "0911000004", "Không Khai", lop=1)

        d = client.get("/admin/suite/attribution", headers=h).json()
        rows = {r["nguon"]: r for r in d["rows"]}
        assert rows["fb_ads"] == {"nguon": "fb_ads", "dang_ky": 2, "tao_lop": 1, "kich_hoat": 1}
        assert rows["fb_group"]["dang_ky"] == 1 and rows["fb_group"]["kich_hoat"] == 0
        # BR5: không suy diễn — người không khai nằm RIÊNG, không rơi vào nguồn nào
        assert d["chua_khai_nguon"] == 1
        assert "Không Khai" not in str(d["rows"])

    def test_attribution_rong_thi_noi_thang(self, auth_client, monkeypatch):
        """BR7: chưa ai khai nguồn → rows rỗng + chua_khai đếm đúng, không bịa."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        d = client.get("/admin/suite/attribution", headers=h).json()
        assert d["rows"] == []


class TestSuiteSecurity:
    """AC8 — toàn bộ sau đăng nhập admin."""

    @pytest.mark.parametrize("path,method", [
        pytest.param("/admin/suite/overview", "get", id="overview"),
        pytest.param("/admin/suite/crm", "get", id="crm-queue"),
        pytest.param("/admin/suite/crm/act", "post", id="crm-act"),
        pytest.param("/admin/suite/attribution", "get", id="attribution"),
        pytest.param("/admin/suite/strategy", "get", id="strategy"),
    ])
    def test_suite_requires_admin(self, auth_client, path, method):
        client, _ = auth_client
        r = getattr(client, method)(path, **({"json": {}} if method == "post" else {}))
        # 401 hoặc 403 đều là 'chưa đăng nhập admin' — HTTPBearer trả 403 khi
        # THIẾU header (nhất quán toàn bộ /admin/* sẵn có), 401 khi token sai.
        assert r.status_code in (401, 403)


class TestStrategyResilience:
    """AC6 — khu Lắng nghe hỏng không kéo sập khu Chiến lược."""

    def test_strategy_song_khi_intel_chet(self, auth_client, monkeypatch):
        """EF1: proxy kho lắng nghe lỗi → vẫn 200, việc GTM vẫn về, intel kèm cờ lỗi."""
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        import daythem.entrypoints.routers.admin_suite as suite
        monkeypatch.setattr(suite, "_fetch_intel",
                            lambda: (_ for _ in ()).throw(RuntimeError("marketing sập")))
        r = client.get("/admin/suite/strategy", headers=h)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["viec"], list)
        assert d["intel"]["ok"] is False and d["intel"]["error"]


class TestStrategyMark:
    """AC5 — đánh dấu tiến độ việc, cùng nghiệp vụ với bot (BR1)."""

    @pytest.mark.parametrize("status,expect", [
        pytest.param("done", 200, id="done"),
        pytest.param("doing", 200, id="doing"),
        pytest.param("skip", 200, id="skip"),
        pytest.param("bay", 422, id="ef:status-la"),
    ])
    def test_strategy_mark(self, auth_client, monkeypatch, status, expect):
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        viec = client.get("/admin/suite/strategy", headers=h).json()["viec"]
        assert viec, "seed_tasks phải gieo được việc"
        r = client.post("/admin/suite/strategy/mark", headers=h,
                        json={"key": viec[0]["key"], "status": status})
        assert r.status_code == expect
        if expect == 200:
            assert r.json()["status"] == status

    def test_strategy_mark_key_la_404(self, auth_client, monkeypatch):
        client, _ = auth_client
        h = _admin(client, monkeypatch)
        r = client.post("/admin/suite/strategy/mark", headers=h,
                        json={"key": "khong-ton-tai", "status": "done"})
        assert r.status_code == 404


class TestSuitePage:
    """Trang một-cửa phục vụ được và chứa đủ 5 khu."""

    def test_suite_page_du_5_khu(self, auth_client):
        client, _ = auth_client
        r = client.get("/admin/suite/page")
        assert r.status_code == 200
        for khu in ("kOverview", "kCrm", "kJourney", "kMarketing", "kStrategy"):
            assert khu in r.text, f"thiếu khu {khu}"
        assert "gc_admin_tok" in r.text     # cùng khoá đăng nhập với users.html
