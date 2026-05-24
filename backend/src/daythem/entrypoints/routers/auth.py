from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.entrypoints.security import create_token
from daythem.service.handlers import (
    RequestOTPCommand, VerifyOTPCommand, UpdateProfileCommand,
    LoginWithPasswordCommand,
    handle_request_otp, handle_verify_otp, handle_update_profile,
    handle_login_with_password,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM

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
    name: str
    avatar_url: str | None = None


def teacher_out(t: TeacherORM) -> dict:
    return {
        "id": t.id,
        "phone": t.phone,
        "name": t.name,
        "avatar_url": t.avatar_url,
        "created_at": t.created_at.isoformat(),
    }


@router.post("/login")
def login_with_password(body: LoginBody, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    try:
        teacher = handle_login_with_password(
            LoginWithPasswordCommand(phone=body.phone, password=body.password), uow
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_token(teacher.id)
    return {"token": token, "teacher": teacher_out(teacher)}


@router.post("/request-otp")
def request_otp(body: RequestOTPBody, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    code = handle_request_otp(RequestOTPCommand(phone=body.phone), uow)
    # In production: send SMS. In dev mode: return code in response.
    return {"message": "OTP đã gửi", "dev_code": code}


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPBody, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
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
        UpdateProfileCommand(teacher_id=teacher.id, name=body.name, avatar_url=body.avatar_url),
        uow,
    )
    return teacher_out(updated)
