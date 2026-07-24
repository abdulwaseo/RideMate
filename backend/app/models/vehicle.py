from sqlalchemy import Column, String, Integer, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.schemas.enums import VehicleType


class Vehicle(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Vehicle entity owned by a Driver.
    Includes manufacturer, model, registration plate, seat capacity, color, 
    and is_active state flag for publishing rides. Supports soft delete.
    """

    driver_profile_id = Column(
        ForeignKey("driver_profile.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_type = Column(
        Enum(VehicleType),
        nullable=False,
    )
    manufacturer = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    color = Column(String(30), nullable=False)
    seat_capacity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    driver_profile = relationship("DriverProfile", back_populates="vehicles")
