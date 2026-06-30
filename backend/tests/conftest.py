import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from daythem.adapters.orm import Base
from daythem.entrypoints.app import app
from daythem.entrypoints.deps import get_db, get_uow
from daythem.service.unit_of_work import SqlAlchemyUnitOfWork

TEST_DB_URL = "sqlite:///./test_daythem.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    from daythem.entrypoints import ratelimit
    ratelimit.reset()  # in-memory limiter persists across tests in one process
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    def override_get_uow():
        return SqlAlchemyUnitOfWork(TestSession)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_uow] = override_get_uow
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    client.post("/api/v1/auth/request-otp", json={"phone": "0901234567"})
    resp = client.post("/api/v1/auth/verify-otp", json={"phone": "0901234567", "code": "123456"})
    token = resp.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client, resp.json()["teacher"]


@pytest.fixture
def password_auth_client(client):
    resp = client.post("/api/v1/auth/login", json={"phone": "0912345678", "password": "test123"})
    token = resp.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client, resp.json()["teacher"]
