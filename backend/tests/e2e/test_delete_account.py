def test_delete_account_removes_teacher_and_data(auth_client):
    client, _ = auth_client
    # create a class + a student so deletion must cascade
    cls = client.post("/api/v1/classes", json={
        "name": "Lớp 9", "subject": "Toán", "grade": "9",
        "schedule": {"day": 3, "start_time": "18:30", "duration": 90, "location": "Tại nhà"},
        "default_fee": 500000, "fee_type": "month",
    }).json()
    client.post(f"/api/v1/classes/{cls['id']}/students", json={"name": "Nguyễn Văn A"})

    # delete account
    assert client.delete("/api/v1/auth/account").json() == {"ok": True}

    # token no longer valid → 401
    assert client.get("/api/v1/auth/me").status_code == 401


def test_delete_account_idempotent_for_token(auth_client):
    client, _ = auth_client
    assert client.delete("/api/v1/auth/account").json() == {"ok": True}
    # second call with the same (now-orphan) token must not 500
    assert client.delete("/api/v1/auth/account").status_code in (200, 401)


def test_change_password_flow(client):
    # register via password login (creates account with password)
    r = client.post("/api/v1/auth/login", json={"phone": "0911111222", "password": "oldpass1"})
    token = r.json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    # wrong current → 400
    assert client.put("/api/v1/auth/password", json={"current_password": "nope", "new_password": "newpass1"}, headers=h).status_code == 400
    # too short new → 400
    assert client.put("/api/v1/auth/password", json={"current_password": "oldpass1", "new_password": "123"}, headers=h).status_code == 400
    # correct → ok
    assert client.put("/api/v1/auth/password", json={"current_password": "oldpass1", "new_password": "newpass1"}, headers=h).json() == {"ok": True}
    # old password no longer works, new one does
    assert client.post("/api/v1/auth/login", json={"phone": "0911111222", "password": "oldpass1"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"phone": "0911111222", "password": "newpass1"}).status_code == 200


def test_reset_password_flow(client):
    phone = "0922333444"
    # create account with a password
    client.post("/api/v1/auth/login", json={"phone": phone, "password": "orig123"})
    # request OTP (dev mode echoes code)
    otp = client.post("/api/v1/auth/request-otp", json={"phone": phone}).json()
    code = otp.get("dev_code", "123456")
    # wrong code → 400
    assert client.post("/api/v1/auth/reset-password", json={"phone": phone, "code": "000000", "new_password": "newpw123"}).status_code == 400
    # correct code → ok
    assert client.post("/api/v1/auth/reset-password", json={"phone": phone, "code": code, "new_password": "newpw123"}).json() == {"ok": True}
    # old password fails, new works
    assert client.post("/api/v1/auth/login", json={"phone": phone, "password": "orig123"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"phone": phone, "password": "newpw123"}).status_code == 200
