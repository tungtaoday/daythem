from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from daythem.adapters.database import create_tables
from daythem.entrypoints.routers import auth, classes, students, attendance, tuition, announcements, reports

app = FastAPI(title="DayThem API", version="0.1.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(classes.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(tuition.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "service": "daythem-api"}
