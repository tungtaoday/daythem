import pytest


def test_admin_login_wrong_password(auth_client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    client, _ = auth_client
    assert client.post("/admin/login", json={"password": "sai"}).status_code == 401


def test_admin_disabled_when_no_password(auth_client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "")
    client, _ = auth_client
    # Rỗng → mọi mật khẩu đều bị từ chối (admin tắt).
    assert client.post("/admin/login", json={"password": "anything"}).status_code == 401


def test_admin_stats_and_teachers(auth_client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    client, teacher = auth_client
    # fixture đã tạo 1 GV + tạo lớp/HS bên dưới
    klass = client.post("/api/v1/classes", json={"name": "L1", "subject": "Toán", "grade": "9"}).json()
    client.post(f"/api/v1/classes/{klass['id']}/students/bulk", json={"names": ["A", "B"]})

    tok = client.post("/admin/login", json={"password": "owner-secret"}).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}

    st = client.get("/admin/stats", headers=h)
    assert st.status_code == 200
    d = st.json()
    assert d["teachers"] >= 1 and d["classes"] >= 1 and d["students"] >= 2

    tj = client.get("/admin/teachers", headers=h).json()
    assert tj["total"] >= 1
    assert any(x["classes"] >= 1 for x in tj["items"])


def test_admin_requires_admin_token(auth_client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    client, _ = auth_client
    # client mang token GIÁO VIÊN (không phải admin) → 403
    assert client.get("/admin/stats").status_code == 403


def test_admin_page_served(auth_client):
    client, _ = auth_client
    r = client.get("/admin")
    assert r.status_code == 200
    assert "Quản trị" in r.text
