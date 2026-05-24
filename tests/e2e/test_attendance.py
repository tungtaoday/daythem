import pytest


@pytest.fixture
def setup(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9"}).json()
    s1 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "An"}).json()
    s2 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "Bình"}).json()
    return client, klass["id"], s1["id"], s2["id"]


def test_record_attendance(setup):
    client, class_id, s1, s2 = setup
    resp = client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-05-18",
        "records": [
            {"student_id": s1, "present": True},
            {"student_id": s2, "present": False, "absence_reason": "Bệnh"},
        ],
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["session_date"] == "2026-05-18"
    assert data["absent_count"] == 1


def test_list_sessions(setup):
    client, class_id, s1, s2 = setup
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-05-18",
        "records": [{"student_id": s1, "present": True}],
    })
    resp = client.get(f"/api/v1/classes/{class_id}/attendance")
    assert len(resp.json()) == 1


def test_overwrite_attendance(setup):
    client, class_id, s1, s2 = setup
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-05-18",
        "records": [{"student_id": s1, "present": False}],
    })
    resp = client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-05-18",
        "records": [{"student_id": s1, "present": True}],
    })
    assert resp.status_code == 201
    assert resp.json()["absent_count"] == 0
