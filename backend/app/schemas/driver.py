import re
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.schemas.enums import VerificationStatus
from app.schemas.vehicle import VehicleResponse


# Pakistani CNIC format validator regex: 12345-1234567-1 or 1234512345671
CNIC_RE = re.compile(r"^\d{5}-?\d{7}-?\d{1}$")


def validate_cnic(v: str) -> str:
    """Validate 13-digit Pakistani CNIC number."""
    cleaned = v.strip().replace(" ", "")
    if not CNIC_RE.match(cleaned):
        raise ValueError(
            "CNIC number must be a valid 13-digit Pakistani CNIC "
            "(e.g. 42101-1234567-1 or 4210112345671)."
        )
    return cleaned


# ---------- Driver Profile Schemas ----------

class DriverProfileCreate(BaseModel):
    """Payload to upgrade a Passenger account into a Driver profile."""

    cnic_number: str = Field(
        ...,
        examples=["42101-1234567-1"],
        description="13-digit Pakistani CNIC number.",
    )
    license_number: str = Field(
        ...,
        min_length=5,
        max_length=50,
        examples=["DL-KHI-2023-9988"],
        description="Driving license registration code.",
    )

    @field_validator("cnic_number")
    @classmethod
    def check_cnic(cls, v: str) -> str:
        return validate_cnic(v)

    @field_validator("license_number")
    @classmethod
    def check_license(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 5:
            raise ValueError("License number must be at least 5 characters long.")
        return cleaned


class DriverProfileUpdate(BaseModel):
    """Payload to edit driver profile details."""

    cnic_number: Optional[str] = Field(None, examples=["42101-1234567-1"])
    license_number: Optional[str] = Field(None, examples=["DL-KHI-2023-9988"])

    @field_validator("cnic_number")
    @classmethod
    def check_cnic(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_cnic(v)
        return v


class DriverProfileResponse(BaseModel):
    """Output representation of a Driver Profile."""

    id: UUID
    user_id: UUID
    cnic_number: str
    license_number: str
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    vehicles: List[VehicleResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
