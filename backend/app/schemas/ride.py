from datetime import date, datetime, time, timezone
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.enums import RideStatus, VehicleType, VerificationStatus


# ---------- Summaries ----------

class DriverSummary(BaseModel):
    """Driver summary embedded in Ride responses."""

    id: UUID
    user_id: UUID
    name: str
    mobile_number: str
    verification_status: VerificationStatus

    class Config:
        from_attributes = True


class VehicleSummary(BaseModel):
    """Vehicle summary embedded in Ride responses."""

    id: UUID
    vehicle_type: VehicleType
    manufacturer: str
    model: str
    registration_number: str
    color: str
    seat_capacity: int

    class Config:
        from_attributes = True


# ---------- Request Schemas ----------

class RideCreate(BaseModel):
    """Payload to publish a new ride."""

    pickup_area: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Clifton"],
        description="Major pickup neighborhood or area.",
    )
    pickup_point: str = Field(
        ...,
        min_length=3,
        max_length=255,
        examples=["Dolmen Mall Clifton Main Entrance"],
        description="Exact landmark or meeting point.",
    )
    destination_area: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["I.I. Chundrigar Road"],
        description="Major destination area.",
    )
    destination_point: str = Field(
        ...,
        min_length=3,
        max_length=255,
        examples=["Habib Bank Plaza Main Gate"],
        description="Exact drop-off point or office building.",
    )
    departure_date: date = Field(
        ...,
        examples=["2026-07-25"],
        description="Date of commute departure (YYYY-MM-DD). Cannot be in the past.",
    )
    departure_time: time = Field(
        ...,
        examples=["08:30:00"],
        description="Time of commute departure (HH:MM:SS).",
    )
    available_seats: int = Field(
        ...,
        gt=0,
        examples=[3],
        description="Available passenger seats. Must be positive and cannot exceed vehicle capacity.",
    )
    fare_per_passenger: float = Field(
        ...,
        gt=0,
        examples=[250.0],
        description="Fare per seat in PKR. Must be positive.",
    )
    ride_notes: Optional[str] = Field(
        None,
        max_length=500,
        examples=["AC car. Non-smoking. Leaving strictly on time."],
        description="Optional instructions for passengers.",
    )

    @field_validator("departure_date")
    @classmethod
    def check_departure_date(cls, v: date) -> date:
        today = datetime.now(timezone.utc).date()
        if v < today:
            raise ValueError("[RIDE_004] Departure date cannot be in the past.")
        return v


class RideUpdate(BaseModel):
    """Payload to update an existing upcoming ride."""

    pickup_area: Optional[str] = Field(None, min_length=2, max_length=100)
    pickup_point: Optional[str] = Field(None, min_length=3, max_length=255)
    destination_area: Optional[str] = Field(None, min_length=2, max_length=100)
    destination_point: Optional[str] = Field(None, min_length=3, max_length=255)
    departure_date: Optional[date] = Field(None)
    departure_time: Optional[time] = Field(None)
    available_seats: Optional[int] = Field(None, gt=0)
    fare_per_passenger: Optional[float] = Field(None, gt=0)
    ride_notes: Optional[str] = Field(None, max_length=500)

    @field_validator("departure_date")
    @classmethod
    def check_departure_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None:
            today = datetime.now(timezone.utc).date()
            if v < today:
                raise ValueError("[RIDE_004] Departure date cannot be in the past.")
        return v


# ---------- Response Schemas ----------

class RideResponse(BaseModel):
    """Detailed response representation of a Ride."""

    id: UUID
    driver_profile_id: UUID
    vehicle_id: UUID
    pickup_area: str
    pickup_point: str
    destination_area: str
    destination_point: str
    departure_date: date
    departure_time: time
    available_seats: int
    fare_per_passenger: float
    ride_notes: Optional[str] = None
    status: RideStatus
    created_at: datetime
    updated_at: datetime
    driver_summary: Optional[DriverSummary] = None
    vehicle_summary: Optional[VehicleSummary] = None

    class Config:
        from_attributes = True


class RideSummary(BaseModel):
    """Concise representation of a Ride for list views and search results."""

    id: UUID
    pickup_area: str
    destination_area: str
    departure_date: date
    departure_time: time
    available_seats: int
    fare_per_passenger: float
    status: RideStatus
    vehicle_type: Optional[VehicleType] = None
    driver_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
