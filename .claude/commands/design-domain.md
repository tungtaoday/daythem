Read the skill at `C:\DayThem\claude\skills\design-domain\SKILL.md` and execute it.

**DayThem context:**
- Output path: `backend/docs/architecture/domains/{aggregate}.md`
- Tech: FastAPI + SQLAlchemy + Pydantic (NO cypher-core, implement DDD from scratch)
- Existing aggregates: Teacher, Class, Student, Attendance, Tuition, Announcement
- Patterns: SQLAlchemy models in `backend/src/daythem/adapters/models.py`
- Commands/handlers in `backend/src/daythem/handlers.py`
- DB: SQLite (dev) → PostgreSQL (prod)

Domain to design: $ARGUMENTS
