import pytest


@pytest.fixture
def setup(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9", "default_fee": 800000}).json()
    s1 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "An", "parent_name": "Ba An", "parent_phone": "091"}).json()
    s2 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "Bình", "parent_name": "Ba Bình", "parent_phone": "092"}).json()
    client.post(f"/api/v1/classes/{klass['id']}/attendance", json={
        "session_date": "2026-05-12",
        "records": [{"student_id": s1["id"], "present": True}, {"student_id": s2["id"], "present": False}],
    })
    client.post(f"/api/v1/classes/{klass['id']}/tuition/payment", json={"student_id": s1["id"], "paid": True})
    return client, klass["id"]


def test_generate_report(setup):
    client, class_id = setup
    resp = client.post(f"/api/v1/classes/{class_id}/reports/generate", json={"week_start": "2026-05-11"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["week_start"] == "2026-05-11"
    students = data["content"]["students"]
    assert len(students) == 2
    an = next(s for s in students if s["name"] == "An")
    assert an["tuition_paid"] == True
    assert an["sessions_attended"] == 1


def test_list_reports(setup):
    client, class_id = setup
    client.post(f"/api/v1/classes/{class_id}/reports/generate", json={"week_start": "2026-05-11"})
    resp = client.get(f"/api/v1/classes/{class_id}/reports")
    assert len(resp.json()) == 1
