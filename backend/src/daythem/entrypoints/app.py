import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from daythem.adapters.database import create_tables
from daythem.config import settings
from daythem.entrypoints.routers import auth, classes, students, attendance, tuition, announcements, reports, tax, promo, notify

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("daythem")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # In production, refuse to boot on any fatal misconfiguration.
    problems = settings.validate_for_prod()
    if problems:
        raise RuntimeError("Refusing to start in production:\n  - " + "\n  - ".join(problems))
    if settings.is_secret_key_weak:
        logger.warning("SECRET_KEY is weak/placeholder — DEV ONLY. Set a strong SECRET_KEY before deploying.")
    if settings.OTP_DEV_MODE:
        logger.warning("OTP_DEV_MODE is on — OTP is fixed to 123456 and echoed in responses. DEV ONLY.")
    create_tables()
    yield


app = FastAPI(title="DayThem API", version="0.1.0", docs_url="/docs", lifespan=lifespan)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    # Domain validation errors surface as 400 with their message (safe, user-facing).
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak stack traces / internal messages to clients.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Có lỗi xảy ra, vui lòng thử lại."})

# Bearer-token API → no cookies, so credentials are disabled. With credentials off,
# a wildcard origin is safe; lock CORS_ORIGINS to real domains in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
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
app.include_router(tax.router, prefix="/api/v1")
app.include_router(promo.router, prefix="/api/v1")
app.include_router(notify.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "daythem-api"}
