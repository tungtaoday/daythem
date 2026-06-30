# DayThem — Project Overrides

These rules OVERRIDE or SUPPLEMENT the team standards in `claude/rules/` for DayThem specifics.

---

## Test Commands (overrides test-after-changes.md)

DayThem does NOT use `CONFIG_PATH`. Run tests from `backend/`:

```bash
# From C:\DayThem\backend\
python -m pytest tests/e2e/ -v

# Single file
python -m pytest tests/e2e/test_attendance.py -v

# With pattern
python -m pytest tests/e2e/ -k "attendance" -v
```

No JSON artifact required (no `--json-report` flag).

---

## DDD Architecture (DayThem backend)

Stack: FastAPI + SQLAlchemy + Pydantic. **NO cypher-core, NO use-core, NO use-utils.**

### Aggregates & Abbreviations

| Aggregate | Abbrev | Router file |
|-----------|--------|-------------|
| Teacher | TCH | `routers/auth.py` |
| Class | CLS | `routers/classes.py` |
| Student | STU | `routers/students.py` |
| Attendance | ATT | `routers/attendance.py` |
| Tuition | TUI | `routers/tuition.py` |
| Announcement | ANN | `routers/announcements.py` |
| Report | RPT | `routers/reports.py` |

### Clean Architecture Layers

```
mobile (Axios) → FastAPI entrypoints/routers/ → handlers.py → adapters/
```

| Layer | Location | Rule |
|-------|----------|------|
| **Entrypoint** | `entrypoints/routers/{resource}.py` | HTTP only — parse request, call handler, return response |
| **Handler** | `handlers.py` | Business logic — plain functions, no HTTP, no ORM |
| **Adapter** | `adapters/models.py` | SQLAlchemy models only |
| **DB** | `adapters/database.py` | Session management, `get_db()` dependency |

### Layer Rules (MANDATORY)

- Routers MUST NOT contain business logic — delegate to `handlers.py`
- Handlers MUST NOT import FastAPI (`Request`, `Response`, etc.)
- Handlers receive plain Python types, return plain Python dicts/objects
- SQLAlchemy models live ONLY in `adapters/models.py`
- No circular imports between layers

### Response Convention

```python
# Single resource
{"class": {...}}
{"student": {...}}

# Collection
{"items": [...], "total": N}

# Success with no body
{"ok": True}
```

---

## Clean Code Rules (DayThem Python)

### Do
- Type hints on ALL function parameters and return values
- Descriptive names: `get_class_students()` not `get_studs()`
- One function = one responsibility (max ~30 lines)
- Raise `HTTPException` at router level, not in handlers

### Don't
- No `print()` statements in production code
- No commented-out code blocks
- No `# type: ignore` without explanation
- No bare `except:` — always specify exception type

---

## Stage Classification for DayThem

### Strict Mode (all 6 stages)
- New API endpoint
- New database table/column
- New aggregate
- Auth/security changes

### Flexible Mode (skip Stage 1-2)
- Bug fix in existing handler
- UI text change in mobile
- Fix test assertion
- Update CLAUDE.md / docs only

---

## Skills to Use (DayThem mapping)

| Stage | Skill | Command |
|-------|-------|---------|
| 1 — Document UC | `document-domain-uc` or `document-workflow` | `/document-uc` or `/document-workflow` |
| 2 — Design Domain | `design-domain` | `/design-domain` |
| 3 — Write Tests | `write-tests` | `/write-tests` |
| 4 — Implement | `implement-web-service` | `/implement-api` |
| 5 — Run Tests | (manual) | `python -m pytest tests/e2e/ -v` |
| Commit | `push` | `/push` |
