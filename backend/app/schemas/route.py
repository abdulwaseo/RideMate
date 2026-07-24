from typing import List, Optional
from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    place_id: str
    formatted_address: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    area: Optional[str] = None
    country: Optional[str] = None


class FareEstimateSchema(BaseModel):
    minimum_fare: float
    recommended_fare: float
    maximum_fare: float
    base_fare: float
    distance_fare: float
    time_fare: float
    surge_multiplier: float = 1.0
    currency: str = "PKR"


class RouteCalculateRequest(BaseModel):
    pickup_location: LocationSchema
    destination_location: LocationSchema
    vehicle_type: str = Field("car", description="Vehicle type: car, bike, suv, van")


class RouteResponse(BaseModel):
    route_id: str
    pickup_location: LocationSchema
    destination_location: LocationSchema
    distance_km: float
    estimated_duration: float
    traffic_duration: Optional[float] = None
    polyline: Optional[str] = None
    fare_estimate: FareEstimateSchema
    warnings: List[str] = []
