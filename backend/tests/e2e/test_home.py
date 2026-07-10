import pytest


@pytest.fixture
def setup(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={
        "name": "Toán 9", "subject": "Toán", "grade": "9", "default_fee": 500000,
    }).json()
    s1 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "An"}).json()
    s2 = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "Bình"}).json()
    return client, klass["id"], s1["id"], s2["id"]


def test_summary_unpaid_counts_all_then_decrements(setup):
    client, class_id, s1, s2 = setup
    data = client.get("/api/v1/home/summary").json()
    # Chưa ai nộp → 2 học sinh × 500k
    assert data["unpaid"]["count"] == 2
    assert data["unpaid"]["amount"] == 1000000

    client.post(f"/api/v1/classes/{class_id}/tuition/payment",
                json={"student_id": s1, "paid": True, "amount": 500000})
    data2 = client.get("/api/v1/home/summary").json()
    assert data2["unpaid"]["count"] == 1
    assert data2["unpaid"]["amount"] == 500000


def test_summary_free_student_excluded_from_unpaid(setup):
    client, class_id, s1, s2 = setup
    # Miễn phí s2 → chỉ còn s1 chưa nộp
    client.put(f"/api/v1/students/{s2}/fee", json={"fee_type": "free"})
    data = client.get("/api/v1/home/summary").json()
    assert data["unpaid"]["count"] == 1
    assert data["unpaid"]["amount"] == 500000


def test_summary_at_risk_consecutive_absences(setup):
    client, class_id, s1, s2 = setup
    # 2 buổi gần nhất: Bình vắng cả hai → streak 2 → cảnh báo
    for d in ("2026-07-01", "2026-07-03"):
        client.post(f"/api/v1/classes/{class_id}/attendance", json={
            "session_date": d,
            "records": [
                {"student_id": s1, "present": True},
                {"student_id": s2, "present": False},
            ],
        })
    data = client.get("/api/v1/home/summary").json()
    assert data["at_risk_total"] == 1
    assert data["at_risk"][0]["name"] == "Bình"
    assert data["at_risk"][0]["absent_streak"] == 2
    assert data["at_risk"][0]["class_name"] == "Toán 9"
    # An có mặt cả hai → không nằm trong danh sách
    assert all(x["name"] != "An" for x in data["at_risk"])


def test_summary_present_latest_breaks_streak(setup):
    client, class_id, s1, s2 = setup
    # Bình vắng buổi cũ nhưng CÓ MẶT buổi mới nhất → chuỗi đứt → không cảnh báo
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-07-01",
        "records": [{"student_id": s2, "present": False}],
    })
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-07-03",
        "records": [{"student_id": s2, "present": True}],
    })
    data = client.get("/api/v1/home/summary").json()
    assert data["at_risk_total"] == 0


def test_summary_single_absence_not_flagged(setup):
    client, class_id, s1, s2 = setup
    # Chỉ 1 buổi vắng (dưới ngưỡng 2) → không cảnh báo
    client.post(f"/api/v1/classes/{class_id}/attendance", json={
        "session_date": "2026-07-03",
        "records": [{"student_id": s2, "present": False}],
    })
    data = client.get("/api/v1/home/summary").json()
    assert data["at_risk_total"] == 0
