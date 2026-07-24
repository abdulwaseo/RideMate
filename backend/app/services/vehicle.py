from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.vehicle import Vehicle
from app.repositories.driver import DriverRepository
from app.repositories.vehicle import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    """Business logic for Vehicle management."""

    def __init__(self, db: Session):
        self.db = db
        self.driver_repo = DriverRepository(db)
        self.vehicle_repo = VehicleRepository(db)

    def _get_driver_profile(self, user: User):
        profile = self.driver_repo.get_by_user_id(user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[DRIVER_002] Driver profile required to manage vehicles.",
            )
        return profile

    def create_vehicle(self, user: User, payload: VehicleCreate) -> Vehicle:
        driver = self._get_driver_profile(user)

        # Unique registration plate check
        if self.vehicle_repo.get_by_registration(payload.registration_number):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[VEHICLE_002] Vehicle registration number is already registered.",
            )

        # Rule: If driver has no vehicles yet, make the first vehicle active by default
        current_vehicles = self.vehicle_repo.count_by_driver(driver.id)
        should_be_active = payload.is_active or (current_vehicles == 0)

        vehicle = self.vehicle_repo.create(
            driver_profile_id=driver.id,
            vehicle_type=payload.vehicle_type,
            manufacturer=payload.manufacturer,
            model=payload.model,
            registration_number=payload.registration_number,
            color=payload.color,
            seat_capacity=payload.seat_capacity,
            is_active=should_be_active,
        )

        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def list_vehicles(self, user: User) -> List[Vehicle]:
        driver = self._get_driver_profile(user)
        return self.vehicle_repo.list_by_driver(driver.id)

    def get_vehicle(self, user: User, vehicle_id: UUID) -> Vehicle:
        driver = self._get_driver_profile(user)
        vehicle = self.vehicle_repo.get_by_id(vehicle_id)

        if not vehicle or vehicle.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[VEHICLE_001] Vehicle not found or does not belong to driver.",
            )
        return vehicle

    def update_vehicle(self, user: User, vehicle_id: UUID, payload: VehicleUpdate) -> Vehicle:
        vehicle = self.get_vehicle(user, vehicle_id)

        if payload.registration_number and payload.registration_number != vehicle.registration_number:
            if self.vehicle_repo.get_by_registration(payload.registration_number):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="[VEHICLE_002] Vehicle registration number is already registered.",
                )

        updated = self.vehicle_repo.update(
            vehicle,
            vehicle_type=payload.vehicle_type,
            manufacturer=payload.manufacturer,
            model=payload.model,
            registration_number=payload.registration_number,
            color=payload.color,
            seat_capacity=payload.seat_capacity,
        )

        self.db.commit()
        self.db.refresh(updated)
        return updated

    def activate_vehicle(self, user: User, vehicle_id: UUID) -> Vehicle:
        """Mark target vehicle as active for published rides and deactivate others."""
        driver = self._get_driver_profile(user)
        vehicle = self.get_vehicle(user, vehicle_id)

        activated = self.vehicle_repo.set_active(driver.id, vehicle.id)
        if not activated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[VEHICLE_001] Failed to activate vehicle.",
            )

        self.db.commit()
        self.db.refresh(activated)
        return activated

    def delete_vehicle(self, user: User, vehicle_id: UUID) -> None:
        """
        Soft delete a vehicle.
        Rule: Prevent deleting the currently active vehicle if driver has multiple vehicles.
        """
        driver = self._get_driver_profile(user)
        vehicle = self.get_vehicle(user, vehicle_id)

        # Active vehicle deletion check
        if vehicle.is_active:
            total_vehicles = self.vehicle_repo.count_by_driver(driver.id)
            if total_vehicles > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="[VEHICLE_003] Cannot delete active vehicle. Please activate another vehicle first.",
                )

        self.vehicle_repo.soft_delete(vehicle)
        self.db.commit()
