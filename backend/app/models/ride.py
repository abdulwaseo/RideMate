from sqlalchemy import Column, String, Integer, Float, Date, Time, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.schemas.enums import RideStatus


class Ride(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Core Ride entity representing a published carpool commute offer.
    Links driver's active vehicle, pickup & destination coordinates,
    departure schedule, seat availability, and fare. Supports soft deletion.
    """

    driver_profile_id = Column(
        ForeignKey("driver_profile.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_id = Column(
        ForeignKey("vehicle.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    pickup_area = Column(String(100), nullable=False, index=True)
    pickup_point = Column(String(255), nullable=False)

    destination_area = Column(String(100), nullable=False, index=True)
    destination_point = Column(String(255), nullable=False)

    departure_date = Column(Date, nullable=False, index=True)
    departure_time = Column(Time, nullable=False)

    available_seats = Column(Integer, nullable=False)
    fare_per_passenger = Column(Float, nullable=False)

    ride_notes = Column(String(500), nullable=True)

    status = Column(
        Enum(RideStatus),
        default=RideStatus.UPCOMING,
        nullable=False,
        index=True,
    )

    driver_profile = relationship("DriverProfile")
    vehicle = relationship("Vehicle")
