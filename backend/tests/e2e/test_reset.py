"""Quên mật khẩu: form gửi yêu cầu → hàng chờ admin → owner đặt lại."""


def _admin_h(client, monkeypatch):
    from daythem.config import settings
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "owner-secret")
    tok = client.post("/admin/login", json={"password": "owner-secret"}).json()["token"]
    return {"Authorization": f"Bearer {tok}"}


def test_reset_request_created(client):
    r = client.post("/api/v1/auth/reset-request", json={"phone": "0901112223", "note": "cô Lan"})
    assert r.status_code == 200 and r.json() == {"ok": True}


def test_reset_request_empty_phone_422(client):
    assert client.post("/api/v1/auth/reset-request", json={"phone": "   "}).status_code == 422


def test_reset_requests_require_admin(client):
    assert client.get("/admin/reset-requests").status_code in (401, 403)


def test_admin_sees_request_and_resets(password_auth_client, monkeypatch):
    client, _ = password_auth_client  # tạo GV 0912345678 / mật khẩu test123
    client.post("/api/v1/auth/reset-request", json={"phone": "0912345678", "note": "quên pass"})

    h = _admin_h(client, monkeypatch)
    lst = client.get("/admin/reset-requests", headers=h).json()
    assert any(x["phone"] == "0912345678" and x["exists"] for x in lst["items"])

    r = client.post("/admin/reset-password", headers=h, json={"phone": "0912345678", "new_password": "newpass9"})
    assert r.status_code == 200

    # Yêu cầu chuyển done → không còn trong hàng chờ pending.
    lst2 = client.get("/admin/reset-requests", headers=h).json()
    assert all(x["phone"] != "0912345678" for x in lst2["items"])

    # Mật khẩu mới đăng nhập được, mật khẩu cũ bị từ chối.
    assert client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "newpass9"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "test123"}).status_code == 401


def test_admin_reset_unknown_phone_404(auth_client, monkeypatch):
    client, _ = auth_client
    h = _admin_h(client, monkeypatch)
    r = client.post("/admin/reset-password", headers=h, json={"phone": "0000000000", "new_password": "abcdef1"})
    assert r.status_code == 404


def test_admin_reset_short_password_422(password_auth_client, monkeypatch):
    client, _ = password_auth_client
    h = _admin_h(client, monkeypatch)
    r = client.post("/admin/reset-password", headers=h, json={"phone": "0912345678", "new_password": "123"})
    assert r.status_code == 422


def test_delete_account_page_public(client):
    r = client.get("/delete-account")
    assert r.status_code == 200 and "Xoá tài khoản GieoChữ" in r.text


def test_delete_request_queued_with_marker(client, monkeypatch):
    r = client.post("/api/v1/auth/delete-request", json={"phone": "0903334445", "note": "mất máy"})
    assert r.status_code == 200 and r.json() == {"ok": True}
    h = _admin_h(client, monkeypatch)
    lst = client.get("/admin/reset-requests", headers=h).json()
    row = next(x for x in lst["items"] if x["phone"] == "0903334445")
    assert "[XOÁ TÀI KHOẢN]" in (row["note"] or "")


def test_delete_request_empty_phone_422(client):
    assert client.post("/api/v1/auth/delete-request", json={"phone": "  "}).status_code == 422


def test_check_phone_new_vs_existing(password_auth_client):
    client, _ = password_auth_client  # đã tạo GV 0912345678 có mật khẩu
    assert client.post("/api/v1/auth/check-phone", json={"phone": "0912345678"}).json() == {"exists": True}
    assert client.post("/api/v1/auth/check-phone", json={"phone": "0777777777"}).json() == {"exists": False}
