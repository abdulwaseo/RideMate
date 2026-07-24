from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.enums import TrackingStatus


class TrackingSessionResponse(BaseModel):
    """Public representation of an active RideTrackingSession."""

    id: UUID
    ride_id: UUID
    driver_id: UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    current_status: TrackingStatus
    last_location_at: Optional[datetime] = None
    current_eta: Optional[datetime] = None
    eta_minutes: Optional[float] = None
    total_distance_km: Optional[float] = None
    remaining_distance_km: Optional[float] = None
    progress_percent: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class LocationUpdateEvent(BaseModel):
    """Payload for a real-time driver location update broadcast."""

    ride_id: str
    driver_id: str
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None
    recorded_at: str


class ETAPayload(BaseModel):
    """Computed ETA response including remaining distance and phase."""

    ride_id: str
    eta_minutes: Optional[float] = None
    current_eta_iso: Optional[str] = None
    remaining_distance_km: Optional[float] = None
    progress_percent: Optional[float] = None
    current_status: Optional[str] = None
    is_delayed: bool = False


class RouteProgressPayload(BaseModel):
    """Route progress snapshot for live map polyline updates."""

    ride_id: str
    progress_percent: float
    distance_traveled_km: float
    remaining_distance_km: float
    current_phase: str


class TrackingStartPayload(BaseModel):
    """Confirmation payload sent to room on tracking session start."""

    ride_id: str
    session_id: str
    driver_id: str
    status: str
    started_at: str
