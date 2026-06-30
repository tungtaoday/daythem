def _mk(client, **over):
    body = {"name": "Lớp 9", "subject": "Toán", "grade": "9", "fee_type": "month", "default_fee": 500000}
    body.update(over)
    return client.post("/api/v1/classes", json=body).json()


def test_create_with_color(auth_client):
    client, _ = auth_client
    c = _mk(client, color="coral")
    assert c["color"] == "coral"
    assert c["archived"] is False
    listed = client.get("/api/v1/classes").json()
    assert listed[0]["color"] == "coral"


def test_update_color(auth_client):
    client, _ = auth_client
    c = _mk(client)
    upd = client.put(f"/api/v1/classes/{c['id']}", json={"color": "honey"}).json()
    assert upd["color"] == "honey"


def test_archive_and_restore(auth_client):
    client, _ = auth_client
    c = _mk(client, color="green")
    # archive via DELETE → disappears from active list
    assert client.delete(f"/api/v1/classes/{c['id']}").status_code == 204
    assert client.get("/api/v1/classes").json() == []
    # shows in archived list
    arch = client.get("/api/v1/classes", params={"archived": "true"}).json()
    assert len(arch) == 1 and arch[0]["id"] == c["id"] and arch[0]["archived"] is True
    # restore via PUT archived=false
    client.put(f"/api/v1/classes/{c['id']}", json={"archived": False})
    active = client.get("/api/v1/classes").json()
    assert len(active) == 1 and active[0]["id"] == c["id"]
    assert client.get("/api/v1/classes", params={"archived": "true"}).json() == []
