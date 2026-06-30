import json


def test_promo_inactive_when_no_file(client, tmp_path, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "PROMO_PATH", str(tmp_path / "nope.json"))
    resp = client.get("/api/v1/promo")
    assert resp.status_code == 200
    assert resp.json() == {"active": False}


def test_promo_returns_active_banner(client, tmp_path, monkeypatch):
    from daythem.config import settings
    f = tmp_path / "promo.json"
    f.write_text(json.dumps({
        "id": "tet-2026", "active": True, "title": "Chúc mừng năm mới",
        "body": "Ưu đãi gói Pro -50%", "cta_label": "Xem ngay", "cta_url": "https://daythem.vn/tet",
    }), encoding="utf-8")
    monkeypatch.setattr(settings, "PROMO_PATH", str(f))
    resp = client.get("/api/v1/promo")
    data = resp.json()
    assert data["active"] is True
    assert data["title"] == "Chúc mừng năm mới"
    assert data["cta_url"] == "https://daythem.vn/tet"
    assert data["id"] == "tet-2026"


def test_promo_inactive_flag_hides_banner(client, tmp_path, monkeypatch):
    from daythem.config import settings
    f = tmp_path / "promo.json"
    f.write_text(json.dumps({"id": "x", "active": False, "title": "Hidden"}), encoding="utf-8")
    monkeypatch.setattr(settings, "PROMO_PATH", str(f))
    assert client.get("/api/v1/promo").json() == {"active": False}
