import os
os.environ["APP_ENV"] = "testing"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base  # triggers all model metadata registration
from app.db.session import get_db
from app.main import app

SQLITE_TEST_URL = "sqlite:///./test_ridemate.db"

engine = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    """Create database schema once for the test session."""
    if os.path.exists("./test_ridemate.db"):
        os.remove("./test_ridemate.db")

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_ridemate.db"):
        os.remove("./test_ridemate.db")


@pytest.fixture(scope="function", autouse=True)
def clean_tables():
    """Wipe data from all tables before each test function to guarantee isolation."""
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF;"))
        for table in Base.metadata.sorted_tables:
            conn.execute(table.delete())
        conn.execute(text("PRAGMA foreign_keys=ON;"))
        conn.commit()
    yield


@pytest.fixture(scope="function")
def db_session():
    """Provide a transactional DB session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Provide a TestClient with overridden get_db dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
