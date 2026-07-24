from typing import Dict, List, Optional, Tuple


class RouteServicePlaceholder:
    """
    Backend Map & Route Service Placeholder for Sprint 9A.
    Prepares backend interfaces for Sprint 9B Route Engine without directly calling Google APIs yet.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def calculate_distance_and_duration(
        self, origin_coords: Tuple[float, float], destination_coords: Tuple[float, float]
    ) -> Dict[str, float]:
        """
        Placeholder method calculating estimated distance in KM and duration in minutes.
        """
        lat1, lng1 = origin_coords
        lat2, lng2 = destination_coords
        # Simple Euclidean estimation formula
        dist_deg = ((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) ** 0.5
        dist_km = round(dist_deg * 111.0, 2)
        duration_mins = round(dist_km * 2.5, 1)

        return {
            "distance_km": dist_km,
            "duration_minutes": duration_mins,
        }

    def generate_route_polyline(
        self, origin: str, destination: str
    ) -> Dict[str, str]:
        """
        Placeholder method returning encoded polyline string.
        """
        return {
            "origin": origin,
            "destination": destination,
            "polyline": "placeholder_encoded_polyline_sprint_9b",
            "status": "placeholder",
        }
