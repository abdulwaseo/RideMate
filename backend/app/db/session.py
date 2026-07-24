from typing import Generator
from app.db.database import SessionLocal

def get_db() -> Generator:
    """
    Dependency injection helper to yield database sessions.
    Automatically closes session on request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
