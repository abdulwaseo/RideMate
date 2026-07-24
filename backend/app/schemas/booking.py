from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.enums import BookingStatus, ConfirmedBookingStatus, RideStatus


# ---------- Summaries ----------

class PassengerSummary(BaseModel):
    """Passenger summary embedded in request/booking responses."""

    id: UUID
    name: str
    mobile_number: str

    class Config:
        from_attributes = True


class RideBrief(BaseModel):
    """Brief ride info embedded in request/booking responses."""

    id: UUID
    pickup_area: str
    destination_area: str
    departure_date: str
    departure_time: str
    fare_per_passenger: float
    status: RideStatus

    class Config:
        from_attributes = True


# ---------- Request Schemas ----------

class RideRequestCreate(BaseModel):
    """Payload to request a seat on a published ride."""

    ride_id: UUID = Field(..., description="Target published Ride ID.")
    message: Optional[str] = Field(
        None,
        max_length=500,
        examples=["Hi, I work at Dilkusha Towers and would like to join your commute."],
        description="Optional message for the driver.",
    )


# ---------- Response Schemas ----------

class RideRequestResponse(BaseModel):
    """Output representation of a RideRequest."""

    id: UUID
    ride_id: UUID
    passenger_id: UUID
    message: Optional[str] = None
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    passenger_summary: Optional[PassengerSummary] = None
    ride_summary: Optional[RideBrief] = None

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    """Output representation of a confirmed Booking."""

    id: UUID
    ride_id: UUID
    passenger_id: UUID
    request_id: UUID
    seat_number: Optional[int] = None
    booking_status: ConfirmedBookingStatus
    confirmed_at: datetime
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    passenger_summary: Optional[PassengerSummary] = None
    ride_summary: Optional[RideBrief] = None

    class Config:
        from_attributes = True
