"""Phễu kích hoạt (activation funnel) — instrumentation cho BƯỚC 1 GTM."""


def _admin_headers(client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    tok = client.post("/admin/login", json={"password": "owner-secret"}).json()["token"]
    return {"Authorization": f"Bearer {tok}"}


def test_funnel_tracks_class_and_core_action(auth_client, monkeypatch):
    client, _ = auth_client
    # Tạo lớp (class_created) + nhập HS hàng loạt (students_bulk_added = hành động lõi).
    klass = client.post("/api/v1/classes", json={"name": "L1", "subject": "Toán", "grade": "9"}).json()
    client.post(f"/api/v1/classes/{klass['id']}/students/bulk", json={"names": ["An", "Bình"]})

    h = _admin_headers(client, monkeypatch)
    r = client.get("/admin/activation", headers=h)
    assert r.status_code == 200
    d = r.json()

    assert d["total_teachers"] >= 1
    assert d["created_class"] >= 1 and d["created_class_pct"] > 0
    assert d["did_core_action"] >= 1          # bulk add = hành động lõi
    assert d["activated_24h"] >= 1            # GV vừa đăng ký + làm ngay → trong 24h
    assert d["events_by_kind"]["class_created"] >= 1
    assert d["events_by_kind"]["students_bulk_added"] >= 1


def test_client_event_thiep_shared(auth_client, monkeypatch):
    client, _ = auth_client
    client.post("/api/v1/classes", json={"name": "L1", "subject": "Toán", "grade": "9"})

    # Event phía client (chia sẻ thiệp) — được chấp nhận.
    assert client.post("/api/v1/events/track", json={"kind": "thiep_shared"}).json() == {"ok": True}
    # Kind lạ / không thuộc client → bị bỏ qua (vẫn ok, nhưng không ghi).
    assert client.post("/api/v1/events/track", json={"kind": "hack"}).json() == {"ok": True}

    h = _admin_headers(client, monkeypatch)
    d = client.get("/admin/activation", headers=h).json()
    assert d["events_by_kind"]["thiep_shared"] >= 1
    assert "hack" not in d["events_by_kind"]
    assert d["did_core_action"] >= 1          # thiep_shared cũng là hành động lõi


def test_track_requires_auth(client):
    # Không token → 401/403 (không cho ghi event nặc danh).
    assert client.post("/api/v1/events/track", json={"kind": "thiep_shared"}).status_code in (401, 403)
