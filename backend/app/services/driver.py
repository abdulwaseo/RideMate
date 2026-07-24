from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import DriverProfile, User
from app.repositories.driver import DriverRepository
from app.schemas.driver import DriverProfileCreate, DriverProfileUpdate


class DriverService:
    """Business logic for Driver Profile management."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = DriverRepository(db)

    def create_driver_profile(self, user: User, payload: DriverProfileCreate) -> DriverProfile:
        """
        Upgrades an authenticated user to Driver by creating a DriverProfile.

        Raises:
            409 Conflict: If user already has a DriverProfile (DRIVER_001).
            409 Conflict: If CNIC or License number is already registered.
        """
        # Rule: DriverProfile is created only once
        if user.driver_profile:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[DRIVER_001] Driver profile has already been created for this account.",
            )

        # Unique CNIC check
        if self.repo.get_by_cnic(payload.cnic_number):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[VALIDATION_001] CNIC number is already registered to another driver.",
            )

        # Unique License check
        if self.repo.get_by_license(payload.license_number):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[VALIDATION_001] License number is already registered to another driver.",
            )

        profile = self.repo.create(
            user_id=user.id,
            cnic_number=payload.cnic_number,
            license_number=payload.license_number,
        )

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_driver_profile(self, user: User) -> DriverProfile:
        """Retrieve current user's DriverProfile."""
        profile = self.repo.get_by_user_id(user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[DRIVER_002] Driver profile not found. Please create a driver profile first.",
            )
        return profile

    def update_driver_profile(self, user: User, payload: DriverProfileUpdate) -> DriverProfile:
        """Update fields of existing DriverProfile."""
        profile = self.get_driver_profile(user)

        if payload.cnic_number and payload.cnic_number != profile.cnic_number:
            if self.repo.get_by_cnic(payload.cnic_number):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="[VALIDATION_001] CNIC number is already registered to another driver.",
                )

        if payload.license_number and payload.license_number != profile.license_number:
            if self.repo.get_by_license(payload.license_number):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="[VALIDATION_001] License number is already registered to another driver.",
                )

        updated = self.repo.update(
            profile,
            cnic_number=payload.cnic_number,
            license_number=payload.license_number,
        )
        self.db.commit()
        self.db.refresh(updated)
        return updated
