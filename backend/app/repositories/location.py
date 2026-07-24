from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.location import DriverLocation


class LocationRepository:
    """Database repository for DriverLocation GPS telemetry."""

    def __init__(self, db: Session):
        self.db = db

    def upsert_driver_location(
        self,
        driver_id: UUID,
        latitude: float,
        longitude: float,
        ride_id: Optional[UUID] = None,
        heading: Optional[float] = None,
        speed: Optional[float] = None,
        accuracy: Optional[float] = None,
    ) -> DriverLocation:
        existing = (
            self.db.query(DriverLocation)
            .filter(DriverLocation.driver_id == driver_id)
            .first()
        )

        now = datetime.now(timezone.utc)

        if existing:
            existing.latitude = latitude
            existing.longitude = longitude
            existing.ride_id = ride_id
            existing.heading = heading
            existing.speed = speed
            existing.accuracy = accuracy
            existing.recorded_at = now
            existing.updated_at = now
            location_record = existing
        else:
            location_record = DriverLocation(
                driver_id=driver_id,
                ride_id=ride_id,
                latitude=latitude,
                longitude=longitude,
                heading=heading,
                speed=speed,
                accuracy=accuracy,
                recorded_at=now,
                updated_at=now,
            )
            self.db.add(location_record)

        self.db.flush()
        return location_record

    def get_latest_by_driver(self, driver_id: UUID) -> Optional[DriverLocation]:
        return (
            self.db.query(DriverLocation)
            .filter(DriverLocation.driver_id == driver_id)
            .first()
        )

    def get_latest_by_ride(self, ride_id: UUID) -> Optional[DriverLocation]:
        return (
            self.db.query(DriverLocation)
            .filter(DriverLocation.ride_id == ride_id)
            .order_by(DriverLocation.recorded_at.desc())
            .first()
        )

    def delete_by_driver(self, driver_id: UUID) -> bool:
        record = self.get_latest_by_driver(driver_id)
        if record:
            self.db.delete(record)
            self.db.flush()
            return True
        return False
