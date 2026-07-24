from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Initialize SQLAlchemy PostgreSQL Database connection engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Proactively inspects dropped connections
    pool_size=10,        # Default pool connections
    max_overflow=20,     # Burst connection limits
)

# Thread-safe db transaction session local instances
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
