from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin


class AuditLog(Base, UUIDMixin):
    """
    Audit Log entity recording security, administrative, and core business events.
    Tracks user authentication, profile changes, vehicle updates, ride lifecycle, and bookings.
    """

    user_id = Column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(String(100), nullable=True)
    details = Column(String(1000), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = relationship("User")
