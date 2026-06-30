Read the skill at `C:\DayThem\claude\skills\write-tests\SKILL.md` and execute it.

**DayThem context:**
- Backend: `C:\DayThem\backend\` — FastAPI + SQLAlchemy + SQLite (test) / PostgreSQL (prod)
- Tests: `backend/tests/e2e/` — pytest, httpx TestClient
- Run tests: `cd backend && python -m pytest tests/e2e/ -v`
- Existing pattern: `tests/e2e/test_auth.py`, `test_classes.py`, `test_students.py`
- conftest.py fixture: `client` (TestClient with fresh in-memory SQLite per session)
- Test class pattern: `class TestFeatureName:` with parametrized methods

Target feature to test: $ARGUMENTS
