from datetime import datetime, timezone
from sqlalchemy import Column, Float, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin


class DriverLocation(Base, UUIDMixin):
    """
    DriverLocation entity storing GPS telemetry coordinates, heading, speed, and accuracy.
    Supports live trip tracking and ride location history.
    """

    driver_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ride_id = Column(
        ForeignKey("ride.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    heading = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    recorded_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    driver = relationship("User", foreign_keys=[driver_id])
    ride = relationship("Ride", foreign_keys=[ride_id])
