"""Comprehensive data-flow tests for the password-based auth flow.

Covers: registration, login persistence, GET /me response shape,
partial profile updates, and multi-teacher isolation.
"""

import pytest


# ── SC-01: new account via password login ─────────────────────────────────────

def test_new_password_login_teacher_name_is_null(client):
    """First login creates teacher — name is null until profile is set."""
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert resp.status_code == 200
    teacher = resp.json()["teacher"]
    assert teacher["name"] is None
    assert teacher["phone"] == "0912345678"


def test_new_password_login_returns_token(client):
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert "token" in resp.json()
    assert isinstance(resp.json()["token"], str)
    assert len(resp.json()["token"]) > 0


# ── SC-02: login is idempotent — same teacher returned ────────────────────────

def test_second_login_returns_same_teacher_id(client):
    """Re-login with same credentials must return the same teacher object."""
    r1 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    r2 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert r1.json()["teacher"]["id"] == r2.json()["teacher"]["id"]


def test_second_login_different_token_same_teacher(client):
    """Tokens may rotate but teacher ID stays the same."""
    r1 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    r2 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert r1.json()["teacher"]["id"] == r2.json()["teacher"]["id"]


# ── SC-03: GET /auth/me returns complete teacher shape ────────────────────────

EXPECTED_TEACHER_FIELDS = {
    "id", "phone", "name", "avatar_url",
    "push_token", "notif_attendance", "notif_tuition", "notif_report",
    "dnd_start", "dnd_end",
    "tax_id", "full_legal_name", "id_number", "date_of_birth", "address",
    "created_at",
}

def test_get_me_returns_all_fields(password_auth_client):
    client, _ = password_auth_client
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    assert EXPECTED_TEACHER_FIELDS.issubset(resp.json().keys())


def test_get_me_defaults(password_auth_client):
    """Fresh account has correct defaults for all notification and tax fields."""
    client, _ = password_auth_client
    t = client.get("/api/v1/auth/me").json()
    assert t["name"] is None
    assert t["avatar_url"] is None
    assert t["push_token"] is None
    assert t["notif_attendance"] is True
    assert t["notif_tuition"] is True
    assert t["notif_report"] is True
    assert t["tax_id"] is None
    assert t["full_legal_name"] is None
    assert t["id_number"] is None
    assert t["date_of_birth"] is None
    assert t["address"] is None


def test_get_me_without_token_returns_401_or_403(client):
    """Unauthenticated request to /auth/me must be rejected."""
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


# ── SC-04: profile update persists and is reflected in GET /me ────────────────

def test_profile_name_persists_to_get_me(password_auth_client):
    client, _ = password_auth_client
    client.put("/api/v1/auth/profile", json={"name": "Thầy Minh"})
    t = client.get("/api/v1/auth/me").json()
    assert t["name"] == "Thầy Minh"


def test_profile_tax_fields_persist_to_get_me(password_auth_client):
    client, _ = password_auth_client
    client.put("/api/v1/auth/profile", json={
        "tax_id": "0123456789",
        "full_legal_name": "Nguyễn Văn Minh",
        "id_number": "012345678901",
        "date_of_birth": "1990-01-15",
        "address": "123 Đường Lê Lợi, Q.1, TP.HCM",
    })
    t = client.get("/api/v1/auth/me").json()
    assert t["tax_id"] == "0123456789"
    assert t["full_legal_name"] == "Nguyễn Văn Minh"
    assert t["id_number"] == "012345678901"
    assert t["date_of_birth"] == "1990-01-15"
    assert t["address"] == "123 Đường Lê Lợi, Q.1, TP.HCM"


# ── SC-05: partial update preserves untouched fields ─────────────────────────

def test_partial_profile_update_preserves_unset_fields(password_auth_client):
    """Sending only `name` must not reset notification prefs or tax fields."""
    client, _ = password_auth_client

    # First set several fields
    client.put("/api/v1/auth/profile", json={
        "notif_attendance": False,
        "notif_tuition": False,
        "push_token": "ExponentPushToken[abc]",
        "tax_id": "0123456789",
    })

    # Now update only name
    resp = client.put("/api/v1/auth/profile", json={"name": "Cô Lan"})
    assert resp.status_code == 200
    t = resp.json()
    assert t["name"] == "Cô Lan"
    assert t["notif_attendance"] is False
    assert t["notif_tuition"] is False
    assert t["push_token"] == "ExponentPushToken[abc]"
    assert t["tax_id"] == "0123456789"


def test_update_name_then_get_me_consistent(password_auth_client):
    """PUT /profile response and subsequent GET /me must be identical."""
    client, _ = password_auth_client
    put_resp = client.put("/api/v1/auth/profile", json={"name": "Cô Lan"})
    me_resp = client.get("/api/v1/auth/me")
    assert put_resp.json()["name"] == me_resp.json()["name"]
    assert put_resp.json()["id"] == me_resp.json()["id"]


# ── SC-06: login after profile update still returns updated name ──────────────

def test_login_after_profile_update_returns_updated_name(client):
    """Token from second login must reflect profile changes made between logins."""
    # Login once and set name
    r1 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    token = r1.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    client.put("/api/v1/auth/profile", json={"name": "Cô Lan"})
    client.headers.pop("Authorization")

    # Login again — teacher in response must have updated name
    r2 = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "abc123"})
    assert r2.json()["teacher"]["name"] == "Cô Lan"


# ── SC-07: teacher isolation ──────────────────────────────────────────────────

@pytest.fixture
def two_teachers(client):
    """Create two independent teachers and return (client_a, teacher_a, client_b, teacher_b)."""
    from fastapi.testclient import TestClient
    from daythem.entrypoints.app import app
    from daythem.entrypoints.deps import get_db, get_uow
    from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
    from tests.conftest import TestSession

    # Teacher A — reuse the existing `client` fixture's DB session
    r_a = client.post("/api/v1/auth/login", json={"phone": "0911000001", "password": "passA1"})
    assert r_a.status_code == 200
    teacher_a = r_a.json()["teacher"]
    token_a = r_a.json()["token"]

    # Teacher B — uses same DB (same test transaction), different credentials
    r_b = client.post("/api/v1/auth/login", json={"phone": "0922000002", "password": "passB1"})
    assert r_b.status_code == 200
    teacher_b = r_b.json()["teacher"]
    token_b = r_b.json()["token"]

    # Return client instances with appropriate auth headers
    # We clone the client object by yielding token values — TestClient is shared
    return client, teacher_a, token_a, teacher_b, token_b


def test_teacher_a_cannot_read_teacher_b_me(two_teachers):
    """Teacher A's token must return teacher A's data, not teacher B's."""
    client, teacher_a, token_a, teacher_b, token_b = two_teachers
    client.headers["Authorization"] = f"Bearer {token_a}"
    resp = client.get("/api/v1/auth/me")
    assert resp.json()["id"] == teacher_a["id"]
    assert resp.json()["phone"] == "0911000001"


def test_teacher_b_cannot_see_teacher_a_classes(two_teachers):
    """Classes created by teacher A must not appear in teacher B's list."""
    client, teacher_a, token_a, teacher_b, token_b = two_teachers

    # Teacher A creates a class
    client.headers["Authorization"] = f"Bearer {token_a}"
    client.post("/api/v1/classes", json={
        "name": "Lớp A của Cô", "subject": "Toán", "grade": "9",
        "default_fee": 500000, "fee_type": "default",
    })

    # Fetch teacher A's class IDs
    client.headers["Authorization"] = f"Bearer {token_a}"
    a_items = client.get("/api/v1/classes").json()
    if isinstance(a_items, dict):
        a_items = a_items.get("items", [])
    a_ids = {c["id"] for c in a_items}
    assert len(a_ids) == 1  # Teacher A has exactly 1 class

    # Teacher B lists classes — must see no overlap with teacher A
    client.headers["Authorization"] = f"Bearer {token_b}"
    resp = client.get("/api/v1/classes")
    assert resp.status_code == 200
    b_items = resp.json()
    if isinstance(b_items, dict):
        b_items = b_items.get("items", [])
    b_ids = {c["id"] for c in b_items}

    assert not (b_ids & a_ids), "Teacher B sees teacher A's classes"


def test_teacher_a_profile_update_does_not_affect_teacher_b(two_teachers):
    """Updating teacher A's name must not change teacher B's profile."""
    client, teacher_a, token_a, teacher_b, token_b = two_teachers

    client.headers["Authorization"] = f"Bearer {token_a}"
    client.put("/api/v1/auth/profile", json={"name": "Cô Lan"})

    client.headers["Authorization"] = f"Bearer {token_b}"
    resp_b = client.get("/api/v1/auth/me")
    assert resp_b.json()["name"] is None  # Teacher B still has no name
    assert resp_b.json()["id"] == teacher_b["id"]


# ── SC-08: stale / invalid tokens are rejected ───────────────────────────────

def test_invalid_token_rejected_on_me(client):
    client.headers["Authorization"] = "Bearer totally-invalid-jwt"
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


def test_malformed_auth_header_rejected(client):
    client.headers["Authorization"] = "NotBearer abc123"
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)
