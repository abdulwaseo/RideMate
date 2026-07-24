from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus


class RideRequest(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Unconfirmed passenger booking request for a published Ride.
    Requires driver approval (Accept/Reject).
    """

    ride_id = Column(
        ForeignKey("ride.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    passenger_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    message = Column(String(500), nullable=True)
    status = Column(
        Enum(BookingStatus),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True,
    )

    ride = relationship("Ride")
    passenger = relationship("User")
    booking = relationship("Booking", back_populates="request", uselist=False, cascade="all, delete-orphan")


class Booking(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Confirmed seat booking for a published Ride after driver accepts RideRequest.
    Tracks seat reservation and cancellation timestamps.
    """

    ride_id = Column(
        ForeignKey("ride.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    passenger_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    request_id = Column(
        ForeignKey("ride_request.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    seat_number = Column(Integer, nullable=True)
    booking_status = Column(
        Enum(ConfirmedBookingStatus),
        default=ConfirmedBookingStatus.CONFIRMED,
        nullable=False,
        index=True,
    )
    confirmed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    ride = relationship("Ride")
    passenger = relationship("User")
    request = relationship("RideRequest", back_populates="booking")
