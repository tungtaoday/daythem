from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.entrypoints.security import create_token
from daythem.entrypoints.ratelimit import rate_limit, _client_ip
from daythem.service.handlers import (
    RequestOTPCommand, VerifyOTPCommand, UpdateProfileCommand,
    LoginWithPasswordCommand,
    handle_request_otp, handle_verify_otp, handle_update_profile,
    handle_login_with_password,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM
from daythem.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class RequestOTPBody(BaseModel):
    phone: str


class VerifyOTPBody(BaseModel):
    phone: str
    code: str


class LoginBody(BaseModel):
    phone: str
    password: str

class UpdateProfileBody(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    push_token: str | None = None
    notif_attendance: bool | None = None
    notif_tuition: bool | None = None
    notif_report: bool | None = None
    dnd_start: str | None = None
    dnd_end: str | None = None
    tax_id: str | None = None
    full_legal_name: str | None = None
    id_number: str | None = None
    date_of_birth: str | None = None
    address: str | None = None


def teacher_out(t: TeacherORM) -> dict:
    return {
        "id": t.id,
        "phone": t.phone,
        "name": t.name,
        "avatar_url": t.avatar_url,
        "push_token": t.push_token,
        "notif_attendance": t.notif_attendance,
        "notif_tuition": t.notif_tuition,
        "notif_report": t.notif_report,
        "dnd_start": t.dnd_start,
        "dnd_end": t.dnd_end,
        "tax_id": t.tax_id,
        "full_legal_name": t.full_legal_name,
        "id_number": t.id_number,
        "date_of_birth": t.date_of_birth,
        "address": t.address,
        "created_at": t.created_at.isoformat(),
    }


@router.post("/login")
def login_with_password(body: LoginBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    # Throttle by IP and by phone to stop password brute-force.
    rate_limit("login_ip", _client_ip(request), limit=30, window_seconds=60)
    rate_limit("login_phone", body.phone, limit=10, window_seconds=300)
    try:
        teacher = handle_login_with_password(
            LoginWithPasswordCommand(phone=body.phone, password=body.password), uow
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_token(teacher.id)
    return {"token": token, "teacher": teacher_out(teacher)}


@router.post("/request-otp")
def request_otp(body: RequestOTPBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    # Throttle to prevent SMS-bombing / cost abuse.
    rate_limit("otp_req_ip", _client_ip(request), limit=15, window_seconds=3600)
    rate_limit("otp_req_phone", body.phone, limit=3, window_seconds=600)
    code = handle_request_otp(RequestOTPCommand(phone=body.phone), uow)
    # In production: send SMS, never echo the code. Only dev mode returns it.
    resp = {"message": "OTP đã gửi"}
    if settings.OTP_DEV_MODE:
        resp["dev_code"] = code
    return resp


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    # Throttle OTP guessing.
    rate_limit("otp_verify_phone", body.phone, limit=8, window_seconds=600)
    try:
        teacher = handle_verify_otp(VerifyOTPCommand(phone=body.phone, code=body.code), uow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(teacher.id)
    return {"token": token, "teacher": teacher_out(teacher)}


@router.get("/me")
def me(teacher: TeacherORM = Depends(get_current_teacher)):
    return teacher_out(teacher)


@router.put("/profile")
def update_profile(
    body: UpdateProfileBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    updated = handle_update_profile(
        UpdateProfileCommand(
            teacher_id=teacher.id,
            name=body.name,
            avatar_url=body.avatar_url,
            push_token=body.push_token,
            notif_attendance=body.notif_attendance,
            notif_tuition=body.notif_tuition,
            notif_report=body.notif_report,
            dnd_start=body.dnd_start,
            dnd_end=body.dnd_end,
            tax_id=body.tax_id,
            full_legal_name=body.full_legal_name,
            id_number=body.id_number,
            date_of_birth=body.date_of_birth,
            address=body.address,
        ),
        uow,
    )
    return teacher_out(updated)
