from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.schemas.enums import UserRole, VerificationStatus

# --- Driver Profile Schemas ---
class DriverProfileBase(BaseModel):
    vehicle_type: str = Field(..., description="Type of vehicle e.g. Car, Bike")
    vehicle_model: str = Field(..., description="Model detail e.g. Honda Civic 2021")
    vehicle_registration_number: str = Field(..., description="Registration plate e.g. AAA-123")
    license_number: str = Field(..., description="Driving license registration code")
    is_active: bool = True

class DriverProfileCreate(DriverProfileBase):
    pass

class DriverProfileResponse(DriverProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Passenger Profile Schemas ---
class PassengerProfileBase(BaseModel):
    is_active: bool = True

class PassengerProfileCreate(PassengerProfileBase):
    pass

class PassengerProfileResponse(PassengerProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- User Base Schemas ---
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: str = Field(..., min_length=3, max_length=50)
    mobile_number: str = Field(..., description="Karachi coworker phone prefix e.g. +923xx...")
    cnic_number: Optional[str] = Field(None, description="CNIC validation string e.g. 12345-1234567-1")
    role: UserRole = UserRole.PASSENGER
    verification_status: VerificationStatus = VerificationStatus.PENDING

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Commuter account password string")

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    driver_profile: Optional[DriverProfileResponse] = None
    passenger_profile: Optional[PassengerProfileResponse] = None

    class Config:
        from_attributes = True
