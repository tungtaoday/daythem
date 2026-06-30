import json


def test_config_defaults(auth_client):
    client, _ = auth_client
    data = client.get("/api/v1/notify/config").json()
    assert "rules" in data and "class_reminder" in data["rules"]
    assert data["rules"]["class_reminder"]["lead_minutes"] == 30
    assert "contact_policy" in data
    assert "segments" in data
    assert data["marketing_opt_in"] in (True, False)


def test_new_user_segment(auth_client):
    client, _ = auth_client
    data = client.get("/api/v1/notify/config").json()
    # freshly created teacher → new_user + no_class
    assert "new_user" in data["segments"]
    assert "no_class" in data["segments"]


def test_update_prefs_user_overrides(auth_client):
    client, _ = auth_client
    resp = client.put("/api/v1/notify/prefs", json={
        "rules": {"class_reminder": {"lead_minutes": 15}, "morning_summary": {"enabled": False}},
        "quiet_hours": ["23:00", "06:30"],
        "marketing_opt_in": False,
    })
    data = resp.json()
    assert data["rules"]["class_reminder"]["lead_minutes"] == 15
    assert data["rules"]["morning_summary"]["enabled"] is False
    assert data["contact_policy"]["quiet_hours"] == ["23:00", "06:30"]
    assert data["marketing_opt_in"] is False


def test_register_token(auth_client):
    client, _ = auth_client
    assert client.post("/api/v1/notify/register-token", json={"token": "ExponentPushToken[abc]"}).json() == {"ok": True}
    assert client.get("/api/v1/auth/me").json()["push_token"] == "ExponentPushToken[abc]"


def test_marketing_opt_out_hides_campaigns(auth_client, tmp_path, monkeypatch):
    from daythem.config import settings
    f = tmp_path / "camp.json"
    f.write_text(json.dumps({"campaigns": [
        {"id": "c1", "active": True, "title": "Ưu đãi", "body": "Giảm 50%"}
    ]}), encoding="utf-8")
    monkeypatch.setattr(settings, "NOTIFY_CAMPAIGNS_PATH", str(f))
    client, _ = auth_client
    # opted in by default → campaign visible
    assert len(client.get("/api/v1/notify/campaigns").json()["campaigns"]) == 1
    # opt out → hidden
    client.put("/api/v1/notify/prefs", json={"marketing_opt_in": False})
    assert client.get("/api/v1/notify/campaigns").json()["campaigns"] == []


def test_fatigue_throttles_marketing(auth_client, tmp_path, monkeypatch):
    from daythem.config import settings
    f = tmp_path / "camp.json"
    f.write_text(json.dumps({"campaigns": [
        {"id": "c1", "active": True, "title": "A", "body": "x"},
        {"id": "c2", "active": True, "title": "B", "body": "y"},
    ]}), encoding="utf-8")
    monkeypatch.setattr(settings, "NOTIFY_CAMPAIGNS_PATH", str(f))
    client, _ = auth_client
    # log 6 dismissed marketing events, 0 opened → fatigue cap = 0
    for _ in range(6):
        client.post("/api/v1/notify/events", json={"channel": "marketing", "rule": "c1", "event_type": "dismissed"})
    cfg = client.get("/api/v1/notify/config").json()
    assert cfg["contact_policy"]["max_marketing_per_week"] == 0
    assert client.get("/api/v1/notify/campaigns").json()["campaigns"] == []
