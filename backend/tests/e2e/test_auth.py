def test_request_otp(client):
    resp = client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    assert resp.status_code == 200
    assert "dev_code" in resp.json()


def test_verify_otp_creates_teacher(client):
    client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    resp = client.post("/api/v1/auth/verify-otp", json={"phone": "0901234567", "code": "123456"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["teacher"]["phone"] == "0901234567"


def test_verify_otp_wrong_code(client):
    client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    resp = client.post("/api/v1/auth/verify-otp", json={"phone": "0901234567", "code": "000000"})
    assert resp.status_code == 400


def test_verify_otp_idempotent(client):
    client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    client.post("/api/v1/auth/verify-otp", json={"phone": "0901234567", "code": "123456"})
    client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    resp = client.post("/api/v1/auth/verify-otp", json={"phone": "0901234567", "code": "123456"})
    assert resp.status_code == 200


def test_get_me(auth_client):
    client, teacher = auth_client
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    assert resp.json()["id"] == teacher["id"]


def test_update_profile(auth_client):
    client, teacher = auth_client
    resp = client.put("/api/v1/auth/profile", json={"name": "Cô Lan"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Cô Lan"


def test_login_creates_account(client):
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["teacher"]["phone"] == "0912345678"


def test_login_wrong_password(client):
    client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "wrong"})
    assert resp.status_code == 401


def test_login_idempotent(client):
    client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_otp_account_cannot_be_claimed_by_password_login(client):
    # Security: an account created via OTP (no password) must NOT have its password
    # silently set by an arbitrary password login (account-takeover prevention).
    client.post("/api/v1/auth/request-otp", json={"phone": "0901111111"})
    client.post("/api/v1/auth/verify-otp", json={"phone": "0901111111", "code": "123456"})
    resp = client.post("/api/v1/auth/login", json={"phone": "0901111111", "password": "newpass"})
    assert resp.status_code == 401
    assert "OTP" in resp.json()["detail"]
    # The legitimate owner can still log in via a fresh OTP.
    client.post("/api/v1/auth/request-otp", json={"phone": "0901111111"})
    resp2 = client.post("/api/v1/auth/verify-otp", json={"phone": "0901111111", "code": "123456"})
    assert resp2.status_code == 200
