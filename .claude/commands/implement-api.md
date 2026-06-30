Read the skill at `C:\DayThem\claude\skills\implement-web-service\SKILL.md` and execute it.

**DayThem context:**
- Backend root: `C:\DayThem\backend\src\daythem\`
- Router files: `entrypoints/routers/{resource}.py`
- Register router in: `entrypoints/app.py`
- Business logic: `handlers.py` (plain functions, no OOP)
- DB models: `adapters/models.py` (SQLAlchemy)
- DB session: `adapters/database.py` → `get_db()` dependency
- Auth dependency: `entrypoints/routers/auth.py` → `get_current_teacher`
- Response convention: `{ "resource_name": {...} }` or `{ "items": [...] }`
- DO NOT use cypher-core — implement directly with FastAPI + SQLAlchemy

Endpoint to implement: $ARGUMENTS
