from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class LocationUpdatePayload(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    heading: Optional[float] = Field(None, ge=0.0, le=360.0, description="Heading direction in degrees")
    speed: Optional[float] = Field(None, ge=0.0, description="Speed in m/s")
    accuracy: Optional[float] = Field(None, ge=0.0, description="Accuracy radius in meters")
    ride_id: Optional[UUID] = Field(None, description="Active ride UUID context")


class DriverLocationResponse(BaseModel):
    id: UUID
    driver_id: UUID
    ride_id: Optional[UUID] = None
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None
    recorded_at: datetime
    updated_at: datetime
