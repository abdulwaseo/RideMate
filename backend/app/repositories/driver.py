from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import DriverProfile, User
from app.schemas.enums import UserRole, VerificationStatus


class DriverRepository:
    """Database operations for DriverProfile entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, driver_id: UUID) -> Optional[DriverProfile]:
        return self.db.query(DriverProfile).filter(
            DriverProfile.id == driver_id
        ).first()

    def get_by_user_id(self, user_id: UUID) -> Optional[DriverProfile]:
        return self.db.query(DriverProfile).filter(
            DriverProfile.user_id == user_id
        ).first()

    def get_by_cnic(self, cnic_number: str) -> Optional[DriverProfile]:
        return self.db.query(DriverProfile).filter(
            DriverProfile.cnic_number == cnic_number
        ).first()

    def get_by_license(self, license_number: str) -> Optional[DriverProfile]:
        return self.db.query(DriverProfile).filter(
            DriverProfile.license_number == license_number
        ).first()

    def create(
        self,
        *,
        user_id: UUID,
        cnic_number: str,
        license_number: str,
    ) -> DriverProfile:
        profile = DriverProfile(
            user_id=user_id,
            cnic_number=cnic_number,
            license_number=license_number,
            verification_status=VerificationStatus.PENDING,
        )
        self.db.add(profile)

        # Upgrade user's role to DRIVER as per business rule
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.role = UserRole.DRIVER
            user.cnic_number = cnic_number

        self.db.flush()
        return profile

    def update(
        self,
        profile: DriverProfile,
        *,
        cnic_number: Optional[str] = None,
        license_number: Optional[str] = None,
    ) -> DriverProfile:
        if cnic_number is not None:
            profile.cnic_number = cnic_number
        if license_number is not None:
            profile.license_number = license_number

        self.db.flush()
        return profile
