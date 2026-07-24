from datetime import datetime, timezone
from sqlalchemy import Column, Float, ForeignKey, String, DateTime, Enum
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin
from app.schemas.enums import TrackingStatus


class RideTrackingSession(Base, UUIDMixin, TimestampMixin):
    """
    Persists the state of an active ride tracking session.
    Created when the driver activates live tracking for a ride.
    Closed when the ride is completed or tracking is stopped.
    """

    ride_id = Column(
        ForeignKey("ride.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    driver_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ended_at = Column(DateTime(timezone=True), nullable=True)
    current_status = Column(
        Enum(TrackingStatus),
        default=TrackingStatus.PREPARING,
        nullable=False,
        index=True,
    )
    last_location_at = Column(DateTime(timezone=True), nullable=True)

    # ETA & progress data (refreshed on each location update)
    current_eta = Column(DateTime(timezone=True), nullable=True)
    eta_minutes = Column(Float, nullable=True)
    total_distance_km = Column(Float, nullable=True)
    remaining_distance_km = Column(Float, nullable=True)
    progress_percent = Column(Float, default=0.0, nullable=True)

    ride = relationship("Ride")
    driver = relationship("User", foreign_keys=[driver_id])
