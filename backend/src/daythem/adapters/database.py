from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from daythem.config import settings
from daythem.adapters.orm import Base

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if _is_sqlite else {}

# For server DBs (MySQL/Postgres): recycle idle connections and ping before use so
# a connection dropped by the DB (MySQL wait_timeout) doesn't surface as an error.
engine_kwargs = {} if _is_sqlite else {"pool_pre_ping": True, "pool_recycle": 280}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs)

# Enable WAL mode for SQLite concurrency
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA journal_mode=WAL")
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def get_session() -> Session:
    return SessionLocal()
