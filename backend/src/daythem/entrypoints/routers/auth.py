import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, BeforeValidator
from daythem.phone import normalize_phone, is_valid_vn_mobile
from daythem.entrypoints.deps import get_uow, get_current_teacher
from daythem.adapters.telegram import notify
from daythem.entrypoints.security import create_token
from daythem.entrypoints.ratelimit import rate_limit, _client_ip
from daythem.service.handlers import (
    RequestOTPCommand, VerifyOTPCommand, UpdateProfileCommand,
    LoginWithPasswordCommand,
    handle_request_otp, handle_verify_otp, handle_update_profile,
    handle_login_with_password, handle_delete_account, handle_change_password,
    handle_reset_password,
)
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork
from daythem.adapters.orm import TeacherORM, PasswordResetRequestORM
from daythem.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# SĐT được chuẩn hoá NGAY khi parse request. Quan trọng gấp đôi:
#  1) mọi so khớp tài khoản dùng chung một dạng → không đẻ tài khoản trùng;
#  2) khoá rate-limit cũng thành một → kẻ dò mật khẩu không thể lách giới hạn
#     bằng cách đổi cách viết ("0905...", "+84905...", "090 5..." từng là 3 bộ đếm riêng).
Phone = Annotated[str, BeforeValidator(normalize_phone)]


class RequestOTPBody(BaseModel):
    phone: Phone


class VerifyOTPBody(BaseModel):
    phone: Phone
    code: str
    source: Optional[str] = None


class LoginBody(BaseModel):
    phone: Phone
    password: str
    source: Optional[str] = None  # kênh GV đến từ (app gửi khi đăng ký lần đầu)

class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordBody(BaseModel):
    phone: Phone
    code: str
    new_password: str

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
    source: str | None = None    # nguồn biết tới app — chỉ ghi lần đầu (attribution)


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
            LoginWithPasswordCommand(phone=body.phone, password=body.password, source=body.source), uow
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_token(teacher.id)

    # Tài khoản vừa tạo (đăng nhập lần đầu) → báo owner qua Telegram.
    try:
        from datetime import datetime
        from daythem.adapters.telegram import notify
        age = (datetime.utcnow() - teacher.created_at.replace(tzinfo=None)).total_seconds()
        if age < 15:
            notify(f"🌱 <b>GieoChữ — user mới</b>\nSĐT: {teacher.phone}\nID: {teacher.id[:8]}")
    except Exception:
        pass

    return {"token": token, "teacher": teacher_out(teacher)}


@router.post("/request-otp")
def request_otp(body: RequestOTPBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    # Throttle to prevent SMS-bombing / cost abuse.
    rate_limit("otp_req_ip", _client_ip(request), limit=15, window_seconds=3600)
    rate_limit("otp_req_phone", body.phone, limit=3, window_seconds=600)
    # Chặn số sai định dạng TRƯỚC khi sinh mã: khi nối SMS thật, mỗi tin nhắn gửi
    # vào số rác là tiền mất mà không ai nhận được.
    if not is_valid_vn_mobile(body.phone):
        raise HTTPException(status_code=422, detail="Số điện thoại không hợp lệ")
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
        teacher = handle_verify_otp(VerifyOTPCommand(phone=body.phone, code=body.code, source=body.source), uow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(teacher.id)
    return {"token": token, "teacher": teacher_out(teacher)}


@router.get("/me")
def me(teacher: TeacherORM = Depends(get_current_teacher)):
    return teacher_out(teacher)


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    # Throttle reset attempts per phone.
    rate_limit("reset_pw_phone", body.phone, limit=8, window_seconds=600)
    try:
        handle_reset_password(body.phone, body.code, body.new_password, uow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


class CheckPhoneBody(BaseModel):
    phone: Phone


@router.post("/check-phone")
def check_phone(body: CheckPhoneBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Cho màn nhập mật khẩu biết SĐT đã có tài khoản chưa → tách UI 'Tạo mật khẩu'
    (có ô nhập lại, chống gõ nhầm) khỏi UI 'Nhập mật khẩu'. Rate-limit chống dò số."""
    rate_limit("check_phone_ip", _client_ip(request), limit=30, window_seconds=600)
    with uow:
        teacher = uow.teachers.get_by_phone(body.phone)
        return {"exists": teacher is not None and teacher.password_hash is not None}


class ResetRequestBody(BaseModel):
    phone: Phone
    note: str | None = None


@router.post("/reset-request")
def reset_request(body: ResetRequestBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """GV quên mật khẩu gửi yêu cầu từ app → vào hàng chờ để owner xử lý trên admin dashboard.
    Không cần email/SMS: owner thấy yêu cầu trong dashboard (+ Telegram nếu đã bật)."""
    rate_limit("reset_req_ip", _client_ip(request), limit=10, window_seconds=3600)
    rate_limit("reset_req_phone", body.phone, limit=3, window_seconds=600)
    phone = body.phone  # đã chuẩn hoá ở Pydantic validator
    if not phone:
        raise HTTPException(status_code=422, detail="Vui lòng nhập số điện thoại đăng ký")
    note = (body.note or "").strip() or None
    with uow:
        uow._session.add(PasswordResetRequestORM(id=str(uuid.uuid4()), phone=phone, note=note))
        uow.commit()
    notify("🔑 <b>Yêu cầu đặt lại mật khẩu</b>\nSĐT: " + phone + (f"\nGhi chú: {note}" if note else ""))
    return {"ok": True}


@router.post("/delete-request")
def delete_request(body: ResetRequestBody, request: Request, uow: SqlAlchemyUnitOfWork = Depends(get_uow)):
    """Yêu cầu xoá tài khoản gửi từ trang web /delete-account (Google Play bắt buộc
    có đường xoá NGOÀI app). Vào chung hàng chờ với reset — note đánh dấu
    [XOÁ TÀI KHOẢN] để owner phân biệt trên dashboard và xử lý thủ công."""
    rate_limit("delete_req_ip", _client_ip(request), limit=5, window_seconds=3600)
    phone = body.phone  # đã chuẩn hoá ở Pydantic validator
    if not phone:
        raise HTTPException(status_code=422, detail="Vui lòng nhập số điện thoại đăng ký")
    note = "[XOÁ TÀI KHOẢN] " + ((body.note or "").strip() or "yêu cầu từ web")
    with uow:
        uow._session.add(PasswordResetRequestORM(id=str(uuid.uuid4()), phone=phone, note=note))
        uow.commit()
    notify("🗑 <b>Yêu cầu XOÁ TÀI KHOẢN</b>\nSĐT: " + phone)
    return {"ok": True}


@router.put("/password")
def change_password(
    body: ChangePasswordBody,
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    try:
        handle_change_password(teacher.id, body.current_password, body.new_password, uow)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.delete("/account")
def delete_account(
    teacher: TeacherORM = Depends(get_current_teacher),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    """Permanently delete the current teacher's account and all their data.

    Required by Apple App Store / Google Play for apps with account creation.
    """
    with uow:
        handle_delete_account(teacher.id, uow)
    return {"ok": True}


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
            source=body.source,
        ),
        uow,
    )
    return teacher_out(updated)
