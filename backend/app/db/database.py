from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine_kwargs: dict = {
    "pool_pre_ping": True,  # Proactively inspects dropped connections
    "pool_recycle": 300,    # Recycle connections every 5 minutes to prevent stale connections
    "pool_size": 10,        # Default pool connections
    "max_overflow": 20,     # Burst connection limits
}

# Automatically pass sslmode=require for Render, Neon, or cloud Postgres instances
if any(provider in db_url for provider in ["render.com", "neon.tech", "supabase", "cockroach"]) or "sslmode=require" in db_url:
    engine_kwargs["connect_args"] = {"sslmode": "require"}

# Initialize SQLAlchemy PostgreSQL Database connection engine
engine = create_engine(db_url, **engine_kwargs)

# Thread-safe db transaction session local instances
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
