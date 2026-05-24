import pytest


@pytest.fixture
def setup(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9"}).json()
    return client, klass["id"]


def test_cancel_class(setup):
    client, class_id = setup
    resp = client.post(f"/api/v1/classes/{class_id}/cancel", json={
        "session_date": "2026-05-20",
        "content": "Cô bận việc gia đình, lớp nghỉ thứ Ba 20/5 nhé.",
    })
    assert resp.status_code == 201
    assert resp.json()["type"] == "cancel"


def test_propose_makeup(setup):
    client, class_id = setup
    ann = client.post(f"/api/v1/classes/{class_id}/cancel", json={
        "session_date": "2026-05-20",
        "content": "Lớp nghỉ",
    }).json()

    resp = client.post(f"/api/v1/announcements/{ann['id']}/makeup", json={
        "options": [
            {"date": "2026-05-22", "time": "19:00", "label": "Thứ Sáu 22/5 lúc 19:00"},
            {"date": "2026-05-23", "time": "09:00", "label": "Thứ Bảy 23/5 lúc 9:00"},
        ]
    })
    assert resp.status_code == 201
    assert len(resp.json()["options"]) == 2


def test_vote_and_confirm(setup):
    client, class_id = setup
    ann = client.post(f"/api/v1/classes/{class_id}/cancel", json={
        "session_date": "2026-05-20",
        "content": "Lớp nghỉ",
    }).json()
    makeup = client.post(f"/api/v1/announcements/{ann['id']}/makeup", json={
        "options": [
            {"date": "2026-05-22", "time": "19:00", "label": "Thứ Sáu"},
            {"date": "2026-05-23", "time": "09:00", "label": "Thứ Bảy"},
        ]
    }).json()

    client.post(f"/api/v1/makeups/{makeup['id']}/vote", json={"option_index": 0, "voter_name": "Phụ huynh An"})
    client.post(f"/api/v1/makeups/{makeup['id']}/vote", json={"option_index": 0, "voter_name": "Phụ huynh Bình"})
    client.post(f"/api/v1/makeups/{makeup['id']}/vote", json={"option_index": 1, "voter_name": "Phụ huynh Cúc"})

    poll = client.get(f"/api/v1/makeups/{makeup['id']}").json()
    assert poll["options"][0]["votes"] == 2
    assert poll["options"][1]["votes"] == 1

    resp = client.post(f"/api/v1/makeups/{makeup['id']}/confirm", json={"option_index": 0})
    assert resp.status_code == 200
    assert resp.json()["confirmed_option"] == 0
