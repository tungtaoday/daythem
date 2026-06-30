import pytest

CURRENT_YEAR = 2026


# ── Helpers ─────────────────────────────────────────────────────────────────

def _setup_class_with_payment(client, amount: float, month: str) -> None:
    klass = client.post("/api/v1/classes", json={
        "name": "Toán 10A", "subject": "Toán", "grade": "10",
        "default_fee": amount,
    }).json()
    student = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "HS Test"}).json()
    client.post(f"/api/v1/classes/{klass['id']}/tuition/payment", json={
        "student_id": student["id"], "paid": True, "amount": amount, "month": month,
    })


# ── Tax summary ──────────────────────────────────────────────────────────────

def test_tax_summary_empty_year(auth_client):
    client, _ = auth_client
    resp = client.get(f"/api/v1/tax/summary?year={CURRENT_YEAR}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_collected"] == 0
    assert data["status"] == "exempt"
    assert data["tax_owed"] == 0
    assert data["by_month"] == []
    assert data["by_class"] == []


def test_tax_summary_below_threshold(auth_client):
    client, _ = auth_client
    _setup_class_with_payment(client, 48_500_000, f"{CURRENT_YEAR}-05")
    resp = client.get(f"/api/v1/tax/summary?year={CURRENT_YEAR}")
    data = resp.json()
    assert data["status"] == "exempt"
    assert data["total_collected"] == 48_500_000
    assert data["taxable_amount"] == 0
    assert data["tax_owed"] == 0


def test_tax_summary_above_threshold_year_2025(auth_client):
    """Over threshold → tax is 2% of the WHOLE revenue (VN cá nhân kinh doanh)."""
    client, _ = auth_client
    _setup_class_with_payment(client, 120_000_000, "2025-06")
    resp = client.get("/api/v1/tax/summary?year=2025")
    data = resp.json()
    assert data["status"] == "taxable"
    assert data["total_collected"] == 120_000_000
    assert data["threshold"] == 100_000_000
    assert data["taxable_amount"] == 120_000_000  # whole revenue, not the excess
    assert abs(data["tax_owed"] - 2_400_000) < 1  # 2% × 120M


def test_tax_summary_exactly_at_threshold_is_exempt(auth_client):
    """Revenue exactly equal to the threshold is still exempt (≤ ngưỡng → miễn)."""
    client, _ = auth_client
    _setup_class_with_payment(client, 100_000_000, "2025-06")
    data = client.get("/api/v1/tax/summary?year=2025").json()
    assert data["status"] == "exempt"
    assert data["taxable_amount"] == 0
    assert data["tax_owed"] == 0


def test_tax_summary_one_vnd_over_threshold_taxes_whole_revenue(auth_client):
    """One VND over the threshold → the entire revenue becomes taxable."""
    client, _ = auth_client
    _setup_class_with_payment(client, 100_000_001, "2025-06")
    data = client.get("/api/v1/tax/summary?year=2025").json()
    assert data["status"] == "taxable"
    assert data["taxable_amount"] == 100_000_001
    assert abs(data["tax_owed"] - 2_000_000.02) < 0.1


def test_tax_summary_threshold_2025(auth_client):
    client, _ = auth_client
    resp = client.get("/api/v1/tax/summary?year=2025")
    assert resp.json()["threshold"] == 100_000_000


def test_tax_summary_threshold_2026(auth_client):
    client, _ = auth_client
    resp = client.get(f"/api/v1/tax/summary?year={CURRENT_YEAR}")
    assert resp.json()["threshold"] == 1_000_000_000  # Nghị định 141/2026: 1 tỷ từ 1/1/2026


def test_tax_summary_by_month_grouping(auth_client):
    client, _ = auth_client
    _setup_class_with_payment(client, 10_000_000, "2025-01")
    _setup_class_with_payment(client, 10_000_000, "2025-03")
    resp = client.get("/api/v1/tax/summary?year=2025")
    data = resp.json()
    months = [m["month"] for m in data["by_month"]]
    assert "2025-01" in months
    assert "2025-03" in months
    assert len(data["by_month"]) == 2


def test_tax_summary_by_class_grouping(auth_client):
    client, _ = auth_client
    # Two payments for same class (same month → only 1 record, but 2 classes)
    klass1 = client.post("/api/v1/classes", json={
        "name": "Lý 11B", "subject": "Lý", "grade": "11", "default_fee": 500_000,
    }).json()
    klass2 = client.post("/api/v1/classes", json={
        "name": "Toán 10A", "subject": "Toán", "grade": "10", "default_fee": 700_000,
    }).json()
    s1 = client.post(f"/api/v1/classes/{klass1['id']}/students", json={"name": "HS 1"}).json()
    s2 = client.post(f"/api/v1/classes/{klass2['id']}/students", json={"name": "HS 2"}).json()
    client.post(f"/api/v1/classes/{klass1['id']}/tuition/payment", json={
        "student_id": s1["id"], "paid": True, "amount": 500_000, "month": "2025-04",
    })
    client.post(f"/api/v1/classes/{klass2['id']}/tuition/payment", json={
        "student_id": s2["id"], "paid": True, "amount": 700_000, "month": "2025-04",
    })
    resp = client.get("/api/v1/tax/summary?year=2025")
    data = resp.json()
    assert len(data["by_class"]) == 2
    # sorted descending by amount — Toán 10A (700k) first
    assert data["by_class"][0]["class_name"] == "Toán 10A"


def test_tax_summary_excludes_unpaid(auth_client):
    client, _ = auth_client
    klass = client.post("/api/v1/classes", json={
        "name": "Hóa 12", "subject": "Hóa", "grade": "12", "default_fee": 50_000_000,
    }).json()
    student = client.post(f"/api/v1/classes/{klass['id']}/students", json={"name": "HS"}).json()
    # Record as UNPAID
    client.post(f"/api/v1/classes/{klass['id']}/tuition/payment", json={
        "student_id": student["id"], "paid": False, "amount": 50_000_000, "month": "2025-06",
    })
    resp = client.get("/api/v1/tax/summary?year=2025")
    assert resp.json()["total_collected"] == 0


def test_tax_summary_text_exempt(auth_client):
    client, _ = auth_client
    _setup_class_with_payment(client, 30_000_000, "2025-06")
    data = client.get("/api/v1/tax/summary?year=2025").json()
    assert "chưa cần nộp thuế TNCN" in data["summary_text"]


def test_tax_summary_text_taxable(auth_client):
    client, _ = auth_client
    _setup_class_with_payment(client, 120_000_000, "2025-06")
    data = client.get("/api/v1/tax/summary?year=2025").json()
    assert "Thuế TNCN cần nộp" in data["summary_text"]


# ── Tax declaration ──────────────────────────────────────────────────────────

def test_tax_declaration_requires_tax_id(auth_client):
    client, _ = auth_client
    resp = client.get(f"/api/v1/tax/declaration?year={CURRENT_YEAR}")
    assert resp.status_code == 422
    assert "MST" in resp.json()["detail"]


def test_tax_declaration_with_tax_id(auth_client):
    client, _ = auth_client
    client.put("/api/v1/auth/profile", json={
        "tax_id": "8012345678",
        "full_legal_name": "Nguyễn Thị Lan",
    })
    resp = client.get(f"/api/v1/tax/declaration?year={CURRENT_YEAR}")
    assert resp.status_code == 200
    data = resp.json()
    assert "declaration_text" in data
    assert "fields" in data
    assert data["fields"]["mst"] == "8012345678"
    assert "8012345678" in data["declaration_text"]
    assert "Nguyễn Thị Lan" in data["declaration_text"]
    assert "09/KK-TNCN" in data["declaration_text"]


def test_tax_declaration_fields_no_income(auth_client):
    client, _ = auth_client
    client.put("/api/v1/auth/profile", json={"tax_id": "1234567890"})
    data = client.get(f"/api/v1/tax/declaration?year={CURRENT_YEAR}").json()
    assert data["fields"]["tong_thu_nhap"] == 0
    assert data["fields"]["thu_nhap_chiu_thue"] == 0
    assert data["fields"]["so_thue_phai_nop"] == 0
    assert "Không phát sinh nghĩa vụ thuế" in data["declaration_text"]


def test_tax_declaration_calculates_tax_owed(auth_client):
    client, _ = auth_client
    client.put("/api/v1/auth/profile", json={"tax_id": "8012345678"})
    _setup_class_with_payment(client, 120_000_000, "2025-06")
    data = client.get("/api/v1/tax/declaration?year=2025").json()
    # 2% of the whole 120M revenue (over the 100M threshold)
    assert data["fields"]["so_thue_phai_nop"] == pytest.approx(2_400_000, abs=1)
    assert "Cần nộp thuế" in data["declaration_text"]


# ── Tax profile (PUT /auth/profile) ─────────────────────────────────────────

def test_update_tax_profile(auth_client):
    client, _ = auth_client
    resp = client.put("/api/v1/auth/profile", json={
        "tax_id": "8012345678",
        "full_legal_name": "Nguyễn Thị Lan",
        "id_number": "012345678901",
        "date_of_birth": "1990-05-15",
        "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["tax_id"] == "8012345678"
    assert data["full_legal_name"] == "Nguyễn Thị Lan"
    assert data["id_number"] == "012345678901"
    assert data["date_of_birth"] == "1990-05-15"
    assert data["address"] == "123 Nguyễn Huệ, Q.1, TP.HCM"


def test_update_tax_profile_partial(auth_client):
    client, _ = auth_client
    client.put("/api/v1/auth/profile", json={"tax_id": "8012345678", "full_legal_name": "Cô Lan"})
    # Update only name — tax fields must not reset
    resp = client.put("/api/v1/auth/profile", json={"name": "Thầy Bình"})
    data = resp.json()
    assert data["name"] == "Thầy Bình"
    assert data["tax_id"] == "8012345678"
    assert data["full_legal_name"] == "Cô Lan"


def test_new_account_has_no_tax_info(client):
    resp = client.post("/api/v1/auth/login", json={"phone": "0999111222", "password": "pass123"})
    teacher = resp.json()["teacher"]
    assert teacher["tax_id"] is None
    assert teacher["full_legal_name"] is None
    assert teacher["id_number"] is None
