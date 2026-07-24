import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.enums import VehicleType


# ---------- Vehicle Schemas ----------

class VehicleCreate(BaseModel):
    """Payload to create a new vehicle for a driver."""

    vehicle_type: VehicleType = Field(
        ...,
        description="Type of vehicle: Car or Bike.",
        examples=[VehicleType.CAR],
    )
    manufacturer: str = Field(
        ...,
        min_length=2,
        max_length=50,
        examples=["Honda"],
        description="Vehicle brand / manufacturer.",
    )
    model: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Civic 2022"],
        description="Vehicle model name or year.",
    )
    registration_number: str = Field(
        ...,
        min_length=3,
        max_length=20,
        examples=["ABC-123"],
        description="Unique registration plate number.",
    )
    color: str = Field(
        ...,
        min_length=2,
        max_length=30,
        examples=["Midnight Black"],
        description="Vehicle body color.",
    )
    seat_capacity: int = Field(
        ...,
        description="Available passenger seats. Bike: max 1. Car: 1 to 7.",
        examples=[4],
    )
    is_active: bool = Field(
        False,
        description="Set as active vehicle for publishing rides. Automatically deactivates previously active vehicle.",
    )

    @field_validator("registration_number")
    @classmethod
    def check_registration(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if len(cleaned) < 3:
            raise ValueError("Registration number must be at least 3 characters long.")
        return cleaned

    @model_validator(mode="after")
    def check_seat_capacity_for_type(self) -> "VehicleCreate":
        v_type = self.vehicle_type
        seats = self.seat_capacity

        if v_type == VehicleType.BIKE:
            if seats < 1 or seats > 1:
                raise ValueError("Bikes allow a maximum seat capacity of 1 passenger.")
        elif v_type == VehicleType.CAR:
            if seats < 1 or seats > 7:
                raise ValueError("Car seat capacity must be between 1 and 7 passengers.")
        return self


class VehicleUpdate(BaseModel):
    """Payload to update an existing vehicle's specifications."""

    vehicle_type: Optional[VehicleType] = Field(None)
    manufacturer: Optional[str] = Field(None, min_length=2, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    registration_number: Optional[str] = Field(None, min_length=3, max_length=20)
    color: Optional[str] = Field(None, min_length=2, max_length=30)
    seat_capacity: Optional[int] = Field(None)

    @field_validator("registration_number")
    @classmethod
    def check_registration(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            if len(cleaned) < 3:
                raise ValueError("Registration number must be at least 3 characters long.")
            return cleaned
        return v

    @model_validator(mode="after")
    def check_seat_capacity(self) -> "VehicleUpdate":
        if self.seat_capacity is not None and self.vehicle_type is not None:
            v_type = self.vehicle_type
            seats = self.seat_capacity
            if v_type == VehicleType.BIKE and (seats < 1 or seats > 1):
                raise ValueError("Bikes allow a maximum seat capacity of 1 passenger.")
            elif v_type == VehicleType.CAR and (seats < 1 or seats > 7):
                raise ValueError("Car seat capacity must be between 1 and 7 passengers.")
        return self


class VehicleResponse(BaseModel):
    """Output representation of a Vehicle entity."""

    id: UUID
    driver_profile_id: UUID
    vehicle_type: VehicleType
    manufacturer: str
    model: str
    registration_number: str
    color: str
    seat_capacity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
