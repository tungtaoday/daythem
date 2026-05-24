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
