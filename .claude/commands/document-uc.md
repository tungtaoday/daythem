Read the skill at `C:\DayThem\claude\skills\document-domain-uc\SKILL.md` and execute it.

**DayThem context:**
- Output path: `backend/docs/use_cases/domain/{aggregate}/{operation}.md`
- Aggregates: Class (CLS), Student (STU), Attendance (ATT), Tuition (TUI), Announcement (ANN), Report (RPT), Teacher (TCH)
- ID format: `DUC-{ABBREV}-{OP}` (e.g., DUC-STU-CREATE, DUC-ATT-MARK)
- API base: `http://localhost:8000/api/v1`
- Auth: Bearer token (JWT) from `POST /auth/login`

Use case to document: $ARGUMENTS
