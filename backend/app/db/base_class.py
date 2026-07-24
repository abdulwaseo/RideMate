import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    """
    Standard declarative base class for all database models.
    Automatically resolves lowercase table naming configurations.
    """
    id: Any
    __name__: str

    @declared_attr
    @classmethod
    def __tablename__(cls) -> str:
        # Convert CamelCase class name to snake_case table name
        name = cls.__name__
        return ''.join(['_' + c.lower() if c.isupper() else c for c in name]).lstrip('_')

class UUIDMixin:
    """SQLAlchemy mixin to generate UUID v4 primary keys for models."""
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )

class TimestampMixin:
    """SQLAlchemy mixin injecting created_at and updated_at datetime stamps."""
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

class SoftDeleteMixin:
    """SQLAlchemy mixin supporting logical deletes and trace logs."""
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
