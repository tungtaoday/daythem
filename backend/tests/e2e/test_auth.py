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


def test_source_ghi_lan_dau(auth_client, db):
    """Câu 'biết GieoChữ từ đâu' trong onboarding ghi vào teachers.source."""
    client, teacher = auth_client
    resp = client.put("/api/v1/auth/profile", json={"source": "fb_ads"})
    assert resp.status_code == 200
    from daythem.adapters.orm import TeacherORM
    t = db.get(TeacherORM, teacher["id"])
    db.refresh(t)
    assert t.source == "fb_ads"


def test_source_khong_bi_de_lan_sau(auth_client, db):
    """Attribution là dấu chân ĐẦU TIÊN — lần lưu hồ sơ sau không được đè.

    Đè một lần là mất vĩnh viễn dữ liệu 'kênh nào ra khách', đúng lúc sắp chạy
    quảng cáo cần tách ad với organic.
    """
    client, teacher = auth_client
    client.put("/api/v1/auth/profile", json={"source": "fb_group"})
    client.put("/api/v1/auth/profile", json={"source": "fb_ads"})       # thử đè
    client.put("/api/v1/auth/profile", json={"name": "Cô Lan Mới"})     # lưu thường
    from daythem.adapters.orm import TeacherORM
    t = db.get(TeacherORM, teacher["id"])
    db.refresh(t)
    assert t.source == "fb_group", "nguồn đầu tiên phải được giữ nguyên"
    assert t.name == "Cô Lan Mới", "các trường khác vẫn cập nhật bình thường"
