import math
import uuid
from typing import Dict, List

from app.schemas.route import (
    FareEstimateSchema,
    LocationSchema,
    RouteCalculateRequest,
    RouteResponse,
)


class RouteService:
    """
    Backend Route Engine & Fare Estimator Service (Sprint 9B).
    Provides standalone backend route calculation and fare calculation without direct Google API dependency.
    """

    VEHICLE_CONFIG: Dict[str, Dict[str, float]] = {
        "bike": {"base": 50.0, "per_km": 20.0, "per_min": 3.0, "min_fare": 80.0},
        "car": {"base": 120.0, "per_km": 45.0, "per_min": 6.0, "min_fare": 200.0},
        "suv": {"base": 180.0, "per_km": 65.0, "per_min": 9.0, "min_fare": 300.0},
        "van": {"base": 250.0, "per_km": 85.0, "per_min": 12.0, "min_fare": 450.0},
    }

    def calculate_fare(
        self, distance_km: float, duration_mins: float, vehicle_type: str = "car"
    ) -> FareEstimateSchema:
        config = self.VEHICLE_CONFIG.get(vehicle_type.lower(), self.VEHICLE_CONFIG["car"])

        base_fare = config["base"]
        distance_fare = distance_km * config["per_km"]
        time_fare = duration_mins * config["per_min"]

        raw_total = base_fare + distance_fare + time_fare
        total = max(raw_total, config["min_fare"])

        recommended = math.ceil(total / 10.0) * 10.0
        minimum = max(math.floor((recommended * 0.85) / 10.0) * 10.0, config["min_fare"])
        maximum = math.ceil((recommended * 1.25) / 10.0) * 10.0

        return FareEstimateSchema(
            minimum_fare=minimum,
            recommended_fare=recommended,
            maximum_fare=maximum,
            base_fare=round(base_fare, 2),
            distance_fare=round(distance_fare, 2),
            time_fare=round(time_fare, 2),
            surge_multiplier=1.0,
            currency="PKR",
        )

    def calculate_route(self, request: RouteCalculateRequest) -> RouteResponse:
        p1 = request.pickup_location
        p2 = request.destination_location

        if p1.latitude == p2.latitude and p1.longitude == p2.longitude:
            raise ValueError("[RIDE_004] Pickup and Destination locations cannot be identical.")

        # Geometric distance estimation
        lat_diff = p1.latitude - p2.latitude
        lng_diff = p1.longitude - p2.longitude
        euclidean_deg = math.sqrt(lat_diff**2 + lng_diff**2)

        # 1.3 road winding factor
        distance_km = round(euclidean_deg * 111.0 * 1.3, 1)
        duration_mins = max(round(distance_km * 2.5), 5)
        fare = self.calculate_fare(distance_km, duration_mins, request.vehicle_type)

        return RouteResponse(
            route_id=f"backend_route_{uuid.uuid4().hex[:8]}",
            pickup_location=p1,
            destination_location=p2,
            distance_km=distance_km,
            estimated_duration=duration_mins,
            traffic_duration=round(duration_mins * 1.1, 1),
            polyline="backend_polyline_placeholder",
            fare_estimate=fare,
            warnings=[],
        )
