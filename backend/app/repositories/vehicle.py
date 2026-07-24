from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.enums import VehicleType


class VehicleRepository:
    """Database operations for Vehicle entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, vehicle_id: UUID) -> Optional[Vehicle]:
        return self.db.query(Vehicle).filter(
            Vehicle.id == vehicle_id,
            Vehicle.is_deleted == False,
        ).first()

    def get_by_registration(self, registration_number: str) -> Optional[Vehicle]:
        return self.db.query(Vehicle).filter(
            Vehicle.registration_number == registration_number,
            Vehicle.is_deleted == False,
        ).first()

    def list_by_driver(self, driver_profile_id: UUID) -> List[Vehicle]:
        return self.db.query(Vehicle).filter(
            Vehicle.driver_profile_id == driver_profile_id,
            Vehicle.is_deleted == False,
        ).order_by(Vehicle.created_at.desc()).all()

    def count_by_driver(self, driver_profile_id: UUID) -> int:
        return self.db.query(Vehicle).filter(
            Vehicle.driver_profile_id == driver_profile_id,
            Vehicle.is_deleted == False,
        ).count()

    def create(
        self,
        *,
        driver_profile_id: UUID,
        vehicle_type: VehicleType,
        manufacturer: str,
        model: str,
        registration_number: str,
        color: str,
        seat_capacity: int,
        is_active: bool = False,
    ) -> Vehicle:
        vehicle = Vehicle(
            driver_profile_id=driver_profile_id,
            vehicle_type=vehicle_type,
            manufacturer=manufacturer,
            model=model,
            registration_number=registration_number,
            color=color,
            seat_capacity=seat_capacity,
            is_active=is_active,
        )
        self.db.add(vehicle)
        self.db.flush()

        # If marked active, ensure previous active vehicles are deactivated
        if is_active:
            self.deactivate_other_vehicles(driver_profile_id, active_vehicle_id=vehicle.id)

        return vehicle

    def update(
        self,
        vehicle: Vehicle,
        *,
        vehicle_type: Optional[VehicleType] = None,
        manufacturer: Optional[str] = None,
        model: Optional[str] = None,
        registration_number: Optional[str] = None,
        color: Optional[str] = None,
        seat_capacity: Optional[int] = None,
    ) -> Vehicle:
        if vehicle_type is not None:
            vehicle.vehicle_type = vehicle_type
        if manufacturer is not None:
            vehicle.manufacturer = manufacturer
        if model is not None:
            vehicle.model = model
        if registration_number is not None:
            vehicle.registration_number = registration_number
        if color is not None:
            vehicle.color = color
        if seat_capacity is not None:
            vehicle.seat_capacity = seat_capacity

        self.db.flush()
        return vehicle

    def deactivate_other_vehicles(self, driver_profile_id: UUID, active_vehicle_id: UUID) -> None:
        """Deactivate all vehicles for this driver except the active_vehicle_id."""
        self.db.query(Vehicle).filter(
            Vehicle.driver_profile_id == driver_profile_id,
            Vehicle.id != active_vehicle_id,
            Vehicle.is_deleted == False,
        ).update({"is_active": False})
        self.db.flush()

    def set_active(self, driver_profile_id: UUID, vehicle_id: UUID) -> Optional[Vehicle]:
        """Mark target vehicle as active and deactivate all other vehicles for driver."""
        vehicle = self.get_by_id(vehicle_id)
        if not vehicle or vehicle.driver_profile_id != driver_profile_id:
            return None

        # Deactivate all driver's vehicles
        self.db.query(Vehicle).filter(
            Vehicle.driver_profile_id == driver_profile_id,
            Vehicle.is_deleted == False,
        ).update({"is_active": False})

        vehicle.is_active = True
        self.db.flush()
        return vehicle

    def soft_delete(self, vehicle: Vehicle) -> None:
        """Soft delete a vehicle."""
        vehicle.is_deleted = True
        vehicle.deleted_at = datetime.now(timezone.utc)
        vehicle.is_active = False
        self.db.flush()
