def test_create_class(auth_client):
    client, _ = auth_client
    resp = client.post("/api/v1/classes", json={
        "name": "Toán · Lớp 9A",
        "subject": "Toán",
        "grade": "9",
        "default_fee": 800000,
        "fee_type": "monthly",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Toán · Lớp 9A"
    assert data["default_fee"] == 800000


def test_list_classes(auth_client):
    client, _ = auth_client
    client.post("/api/v1/classes", json={"name": "Lớp A", "subject": "Toán", "grade": "9"})
    client.post("/api/v1/classes", json={"name": "Lớp B", "subject": "Văn", "grade": "10"})
    resp = client.get("/api/v1/classes")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_update_class(auth_client):
    client, _ = auth_client
    created = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9"}).json()
    resp = client.put(f"/api/v1/classes/{created['id']}", json={"default_fee": 1000000})
    assert resp.status_code == 200
    assert resp.json()["default_fee"] == 1000000


def test_archive_class(auth_client):
    client, _ = auth_client
    created = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9"}).json()
    resp = client.delete(f"/api/v1/classes/{created['id']}")
    assert resp.status_code == 204
    classes = client.get("/api/v1/classes").json()
    assert len(classes) == 0
