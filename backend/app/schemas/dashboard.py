from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class DriverDashboardStats(BaseModel):
    """Driver analytics and ride metrics."""

    total_rides: int = 0
    completed_rides: int = 0
    cancelled_rides: int = 0
    upcoming_rides: int = 0
    average_rating: float = 0.0
    total_ratings_received: int = 0
    total_earnings: float = 0.0  # Placeholder estimate
    passenger_count: int = 0


class PassengerDashboardStats(BaseModel):
    """Passenger commute analytics and trip metrics."""

    completed_trips: int = 0
    upcoming_trips: int = 0
    cancelled_trips: int = 0
    average_driver_rating_given: float = 0.0
    money_saved: float = 0.0  # Placeholder estimate in PKR
    co2_saved_kg: float = 0.0  # Placeholder estimate in kg CO2


class DashboardResponse(BaseModel):
    """Combined User Dashboard payload adapting to user role."""

    user_id: UUID
    user_name: str
    role: str
    driver_stats: Optional[DriverDashboardStats] = None
    passenger_stats: Optional[PassengerDashboardStats] = None

    class Config:
        from_attributes = True


class ProfileSummaryResponse(BaseModel):
    """Comprehensive user profile summary with reputation and commute stats."""

    id: UUID
    name: str
    mobile_number: str
    email: Optional[str] = None
    role: str
    member_since: datetime
    average_rating: float
    total_ratings: int
    completed_rides: int
    completed_trips: int
    statistics: Dict[str, Any]

    class Config:
        from_attributes = True
