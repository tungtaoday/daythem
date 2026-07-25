import pytest


@pytest.fixture
def setup(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9", "default_fee": 800000}).json()
    student = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "An", "parent_phone": "0912345678"}).json()
    return client, klass["id"], student["id"]


def test_get_tuition_unpaid(setup):
    client, class_id, student_id = setup
    resp = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["paid"] == False
    assert data[0]["amount"] == 800000


def test_record_payment(setup):
    client, class_id, student_id = setup
    resp = client.post(f"/api/v1/classes/{class_id}/tuition/payment", json={
        "student_id": student_id,
        "paid": True,
    })
    assert resp.status_code == 200
    assert resp.json()["paid"] == True


def test_discount_fee(setup):
    client, class_id, student_id = setup
    client.put(f"/api/v1/students/{student_id}/fee", json={"fee_type": "discount", "amount": 600000})
    resp = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05")
    assert resp.json()[0]["amount"] == 600000


def test_free_fee(setup):
    client, class_id, student_id = setup
    client.put(f"/api/v1/students/{student_id}/fee", json={"fee_type": "free"})
    resp = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05")
    assert resp.json()[0]["amount"] == 0


# ── Loại thu học phí: month (khoán) / session (theo buổi) / course (theo khoá) ──


def _mk_class(client, fee_type, fee=150000):
    k = client.post("/api/v1/classes", json={
        "name": f"Lop {fee_type}", "subject": "Toan", "grade": "9",
        "default_fee": fee, "fee_type": fee_type,
    }).json()
    s = client.post(f"/api/v1/classes/{k['id']}/students", json={"name": "Binh"}).json()
    return k["id"], s["id"]


def test_fee_type_session_amount_follows_attendance(auth_client):
    """Lop theo buoi: tien thang = don gia x so buoi CO MAT (tu diem danh)."""
    client, _ = auth_client
    class_id, student_id = _mk_class(client, "session", 150000)

    row = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05").json()[0]
    assert row["amount"] == 0 and row["session_count"] == 0
    assert row["class_fee_type"] == "session"

    for date, present in [("2026-05-04", True), ("2026-05-11", True), ("2026-05-18", False), ("2026-06-01", True)]:
        client.post(f"/api/v1/classes/{class_id}/attendance", json={
            "session_date": date, "records": [{"student_id": student_id, "present": present}],
        })
    row = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05").json()[0]
    assert row["amount"] == 300000 and row["session_count"] == 2

    paid = client.post(f"/api/v1/classes/{class_id}/tuition/payment", json={
        "student_id": student_id, "paid": True, "month": "2026-05",
    }).json()
    assert paid["amount"] == 300000


def test_fee_type_session_override_is_per_session(auth_client):
    """Gia rieng tung em o lop theo buoi = gia MOI BUOI (cung don vi voi lop)."""
    client, _ = auth_client
    class_id, student_id = _mk_class(client, "session", 150000)
    client.put(f"/api/v1/students/{student_id}/fee", json={"fee_type": "custom", "amount": 100000})
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-05-04", "records": [{"student_id": student_id, "present": True}],
    })
    row = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05").json()[0]
    assert row["amount"] == 100000 and row["session_count"] == 1


def test_fee_type_course_charged_once(auth_client):
    """Lop theo khoa: thu 1 lan — thang sau khong doi lai."""
    client, _ = auth_client
    class_id, student_id = _mk_class(client, "course", 3000000)

    row = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05").json()[0]
    assert row["amount"] == 3000000 and row["class_fee_type"] == "course"

    client.post(f"/api/v1/classes/{class_id}/tuition/payment", json={
        "student_id": student_id, "paid": True, "month": "2026-05",
    })
    row6 = client.get(f"/api/v1/classes/{class_id}/tuition/2026-06").json()[0]
    assert row6["amount"] == 0 and row6["paid"] == False


def test_fee_type_month_unchanged_and_monthly_normalized(auth_client):
    """Khoan thang giu nguyen; gia tri cu 'monthly' duoc quy ve 'month'."""
    client, _ = auth_client
    class_id, _ = _mk_class(client, "monthly", 800000)
    row = client.get(f"/api/v1/classes/{class_id}/tuition/2026-05").json()[0]
    assert row["amount"] == 800000 and row["class_fee_type"] == "month"


def test_fee_type_invalid_rejected(auth_client):
    client, _ = auth_client
    r = client.post("/api/v1/classes", json={
        "name": "Lop X", "subject": "Toan", "grade": "9", "default_fee": 1, "fee_type": "weekly",
    })
    assert r.status_code in (400, 422)
