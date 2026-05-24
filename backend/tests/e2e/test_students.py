import pytest


@pytest.fixture
def class_id(auth_client):
    client, _ = auth_client
    resp = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9", "default_fee": 800000})
    return resp.json()["id"]


def test_add_student(auth_client, class_id):
    client, _ = auth_client
    resp = client.post(f"/api/v1/classes/{class_id}/students", json={
        "name": "Nguyễn Văn An",
        "parent_name": "Nguyễn Văn Bình",
        "parent_phone": "0912345678",
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Nguyễn Văn An"


def test_list_students(auth_client, class_id):
    client, _ = auth_client
    client.post(f"/api/v1/classes/{class_id}/students", json={"name": "An"})
    client.post(f"/api/v1/classes/{class_id}/students", json={"name": "Bình"})
    resp = client.get(f"/api/v1/classes/{class_id}/students")
    assert len(resp.json()) == 2


def test_set_student_fee(auth_client, class_id):
    client, _ = auth_client
    student = client.post(f"/api/v1/classes/{class_id}/students", json={"name": "An"}).json()
    resp = client.put(f"/api/v1/students/{student['id']}/fee", json={
        "fee_type": "discount",
        "amount": 600000,
        "note": "Học sinh khó khăn",
    })
    assert resp.status_code == 200
    assert resp.json()["amount"] == 600000


def test_remove_student(auth_client, class_id):
    client, _ = auth_client
    student = client.post(f"/api/v1/classes/{class_id}/students", json={"name": "An"}).json()
    client.delete(f"/api/v1/students/{student['id']}")
    students = client.get(f"/api/v1/classes/{class_id}/students").json()
    assert len(students) == 0
