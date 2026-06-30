"""Cross-teacher authorization (IDOR) and abuse-protection tests."""
import pytest


def _login(client, phone, password="secret123"):
    r = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture
def two_teachers_with_class(client):
    """Teacher A owns a class + student + tuition + attendance + report. Returns tokens + ids."""
    tok_a = _login(client, "0900000001")
    client.headers["Authorization"] = f"Bearer {tok_a}"
    klass = client.post("/api/v1/classes", json={"name": "Toán 9", "subject": "Toán", "grade": "9", "default_fee": 500000}).json()
    stu = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "An"}).json()
    client.post(f"/api/v1/classes/{klass['id']}/attendance", json={
        "session_date": "2026-05-12", "records": [{"student_id": stu["id"], "present": True}],
    })
    client.post(f"/api/v1/classes/{klass['id']}/tuition/payment", json={"student_id": stu["id"], "paid": True, "month": "2026-05"})
    ann = client.post(f"/api/v1/classes/{klass['id']}/cancel", json={"session_date": "2026-05-20", "content": "Nghỉ"}).json()

    tok_b = _login(client, "0900000002")
    return {"client": client, "tok_a": tok_a, "tok_b": tok_b,
            "class_id": klass["id"], "student_id": stu["id"], "ann_id": ann["id"]}


def _as_b(ctx):
    ctx["client"].headers["Authorization"] = f"Bearer {ctx['tok_b']}"
    return ctx["client"]


def test_b_cannot_read_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).get(f"/api/v1/classes/{ctx['class_id']}")
    assert r.status_code == 404


def test_b_cannot_update_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).put(f"/api/v1/classes/{ctx['class_id']}", json={"name": "Hacked"})
    assert r.status_code == 404


def test_b_cannot_delete_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).delete(f"/api/v1/classes/{ctx['class_id']}")
    assert r.status_code == 404


def test_b_cannot_list_a_students(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).get(f"/api/v1/classes/{ctx['class_id']}/students")
    assert r.status_code == 404


def test_b_cannot_read_a_student(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).get(f"/api/v1/students/{ctx['student_id']}")
    assert r.status_code in (403, 404)


def test_b_cannot_set_a_student_fee(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).put(f"/api/v1/students/{ctx['student_id']}/fee", json={"fee_type": "free"})
    assert r.status_code in (403, 404)


def test_b_cannot_record_payment_on_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).post(f"/api/v1/classes/{ctx['class_id']}/tuition/payment",
                        json={"student_id": ctx["student_id"], "paid": True})
    assert r.status_code == 404


def test_b_cannot_record_attendance_on_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).post(f"/api/v1/classes/{ctx['class_id']}/attendance",
                        json={"session_date": "2026-05-19", "records": []})
    assert r.status_code == 404


def test_b_cannot_generate_report_on_a_class(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).post(f"/api/v1/classes/{ctx['class_id']}/reports/generate", json={"week_start": "2026-05-11"})
    assert r.status_code == 404


def test_b_cannot_propose_makeup_on_a_announcement(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).post(f"/api/v1/announcements/{ctx['ann_id']}/makeup",
                        json={"options": [{"date": "2026-05-22", "time": "19:00", "label": "T6"}]})
    assert r.status_code == 403


def test_b_tax_summary_excludes_a_revenue(two_teachers_with_class):
    ctx = two_teachers_with_class
    r = _as_b(ctx).get("/api/v1/tax/summary?year=2026")
    assert r.status_code == 200
    assert r.json()["total_collected"] == 0  # B sees none of A's paid tuition


# ── Abuse protection ─────────────────────────────────────────────────────────

def test_login_rate_limited_after_many_attempts(client):
    # Per-phone login limit is 10/5min; the 11th must be throttled.
    last = None
    for _ in range(12):
        last = client.post("/api/v1/auth/login", json={"phone": "0933333333", "password": "wrongpw"})
    assert last.status_code == 429


def test_password_min_length_enforced(client):
    r = client.post("/api/v1/auth/login", json={"phone": "0944444444", "password": "12345"})
    assert r.status_code == 401
