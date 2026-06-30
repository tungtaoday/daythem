Read the skill at `C:\DayThem\claude\skills\design-architecture\SKILL.md` and execute it.

**DayThem context:**
- Output path: `backend/docs/architecture/designs/{design}.md`
- API: FastAPI REST, base `/api/v1`, Bearer token auth
- Backend structure: `entrypoints/routers/` → `handlers.py` → `adapters/`
- Mobile client: React Native + Axios at `mobile/src/api/`
- Sequence diagrams: iPhone → FastAPI → SQLAlchemy → DB

Feature to design: $ARGUMENTS
