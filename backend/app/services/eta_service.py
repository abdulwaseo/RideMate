import math
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from app.schemas.tracking import ETAPayload


class ETAService:
    """
    Stateless ETA calculation service using haversine distance formula.
    Computes ETA, remaining distance, and route progress from GPS coordinates.
    Architecture note: Designed for future swap-in with live-traffic Google Maps Directions API.
    """

    EARTH_RADIUS_KM = 6371.0
    DEFAULT_SPEED_KMH = 40.0   # Urban default when driver speed not available
    APPROACHING_THRESHOLD_KM = 0.5  # Distance (km) when "approaching destination"

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Returns great-circle distance in km between two GPS coordinates."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lam = math.radians(lon2 - lon1)

        a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return ETAService.EARTH_RADIUS_KM * c

    def calculate_eta(
        self,
        *,
        current_lat: float,
        current_lon: float,
        dest_lat: float,
        dest_lon: float,
        speed_kmh: Optional[float] = None,
        total_distance_km: Optional[float] = None,
        start_lat: Optional[float] = None,
        start_lon: Optional[float] = None,
        ride_id: Optional[str] = None,
    ) -> ETAPayload:
        """
        Computes ETA and route progress.
        - remaining_distance: haversine(current → destination)
        - eta_minutes: remaining_distance / effective_speed
        - progress_percent: based on total_distance if provided
        """
        effective_speed = (speed_kmh or 0.0)
        if effective_speed < 5.0:  # Treat very slow / stopped as default urban speed
            effective_speed = self.DEFAULT_SPEED_KMH

        remaining_km = self.haversine_km(current_lat, current_lon, dest_lat, dest_lon)
        eta_minutes = (remaining_km / effective_speed) * 60.0 if effective_speed > 0 else None
        current_eta_dt = (
            datetime.now(timezone.utc) + timedelta(minutes=eta_minutes)
            if eta_minutes is not None
            else None
        )

        progress_percent: Optional[float] = None
        if total_distance_km and total_distance_km > 0:
            traveled = total_distance_km - remaining_km
            progress_percent = max(0.0, min(100.0, (traveled / total_distance_km) * 100.0))
        elif start_lat is not None and start_lon is not None:
            total_km = self.haversine_km(start_lat, start_lon, dest_lat, dest_lon)
            if total_km > 0:
                traveled = total_km - remaining_km
                progress_percent = max(0.0, min(100.0, (traveled / total_km) * 100.0))

        is_approaching = remaining_km <= self.APPROACHING_THRESHOLD_KM

        ride_id_str = str(ride_id) if ride_id else ""
        return ETAPayload(
            ride_id=ride_id_str,
            eta_minutes=round(eta_minutes, 1) if eta_minutes is not None else None,
            current_eta_iso=current_eta_dt.isoformat() if current_eta_dt else None,
            remaining_distance_km=round(remaining_km, 3),
            progress_percent=round(progress_percent, 1) if progress_percent is not None else None,
            is_delayed=False,
        )

    def get_remaining_distance(
        self, current_lat: float, current_lon: float, dest_lat: float, dest_lon: float
    ) -> float:
        """Returns haversine remaining distance in km."""
        return round(self.haversine_km(current_lat, current_lon, dest_lat, dest_lon), 3)

    def get_progress_percent(
        self,
        current_lat: float,
        current_lon: float,
        start_lat: float,
        start_lon: float,
        dest_lat: float,
        dest_lon: float,
    ) -> float:
        """Returns route progress as a percentage 0–100."""
        total = self.haversine_km(start_lat, start_lon, dest_lat, dest_lon)
        remaining = self.haversine_km(current_lat, current_lon, dest_lat, dest_lon)
        if total <= 0:
            return 0.0
        return round(max(0.0, min(100.0, ((total - remaining) / total) * 100.0)), 1)


eta_service = ETAService()
