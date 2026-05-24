from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from daythem.adapters.database import get_session, SessionLocal
from daythem.adapters.orm import TeacherORM
from daythem.entrypoints.security import decode_token
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork

bearer = HTTPBearer()


def get_db() -> Session:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def get_uow() -> SqlAlchemyUnitOfWork:
    return SqlAlchemyUnitOfWork(SessionLocal)


def get_current_teacher(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    session: Session = Depends(get_db),
) -> TeacherORM:
    try:
        teacher_id = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")

    teacher = session.get(TeacherORM, teacher_id)
    if not teacher:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Teacher not found")
    return teacher
