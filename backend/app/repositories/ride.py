from datetime import date, datetime, time, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import or_, and_, asc, desc
from sqlalchemy.orm import Session, joinedload

from app.models.ride import Ride
from app.models.vehicle import Vehicle
from app.models.user import DriverProfile, User
from app.schemas.enums import RideStatus, VehicleType


class RideRepository:
    """Database operations for Ride entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, ride_id: UUID) -> Optional[Ride]:
        return self.db.query(Ride).options(
            joinedload(Ride.driver_profile).joinedload(DriverProfile.user),
            joinedload(Ride.vehicle),
        ).filter(
            Ride.id == ride_id,
            Ride.is_deleted == False,
        ).first()

    def get_active_ride_by_driver(self, driver_profile_id: UUID) -> Optional[Ride]:
        """
        Find any ride by driver that is in an active state
        (Upcoming, Active, or Full). Drivers are allowed only ONE active ride.
        """
        return self.db.query(Ride).filter(
            Ride.driver_profile_id == driver_profile_id,
            Ride.status.in_([RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL]),
            Ride.is_deleted == False,
        ).first()

    def get_driver_rides(self, driver_profile_id: UUID) -> List[Ride]:
        """Fetch all rides for a driver with full driver/vehicle joins."""
        return self.db.query(Ride).options(
            joinedload(Ride.driver_profile).joinedload(DriverProfile.user),
            joinedload(Ride.vehicle),
        ).filter(
            Ride.driver_profile_id == driver_profile_id,
            Ride.is_deleted == False,
        ).order_by(Ride.created_at.desc()).all()

    def create(
        self,
        *,
        driver_profile_id: UUID,
        vehicle_id: UUID,
        pickup_area: str,
        pickup_point: str,
        destination_area: str,
        destination_point: str,
        departure_date: date,
        departure_time: time,
        available_seats: int,
        fare_per_passenger: float,
        ride_notes: Optional[str] = None,
    ) -> Ride:
        ride = Ride(
            driver_profile_id=driver_profile_id,
            vehicle_id=vehicle_id,
            pickup_area=pickup_area,
            pickup_point=pickup_point,
            destination_area=destination_area,
            destination_point=destination_point,
            departure_date=departure_date,
            departure_time=departure_time,
            available_seats=available_seats,
            fare_per_passenger=fare_per_passenger,
            ride_notes=ride_notes,
            status=RideStatus.UPCOMING,
        )
        self.db.add(ride)
        self.db.flush()
        return ride

    def update(self, ride: Ride, **kwargs) -> Ride:
        for key, value in kwargs.items():
            if value is not None and hasattr(ride, key):
                setattr(ride, key, value)
        self.db.flush()
        return ride

    def search(
        self,
        *,
        pickup_area: Optional[str] = None,
        destination_area: Optional[str] = None,
        departure_date: Optional[date] = None,
        vehicle_type: Optional[VehicleType] = None,
        min_available_seats: Optional[int] = None,
        sort_by: str = "departure_time",
        order: str = "asc",
        page: int = 1,
        size: int = 10,
    ) -> Tuple[List[Ride], int]:
        """
        Search and filter upcoming rides with pagination and sorting.

        Returns (list_of_rides, total_count).
        """
        query = self.db.query(Ride).options(
            joinedload(Ride.driver_profile).joinedload(DriverProfile.user),
            joinedload(Ride.vehicle),
        ).filter(
            Ride.status == RideStatus.UPCOMING,
            Ride.available_seats > 0,
            Ride.is_deleted == False,
        )

        if pickup_area:
            query = query.filter(Ride.pickup_area.ilike(f"%{pickup_area}%"))

        if destination_area:
            query = query.filter(Ride.destination_area.ilike(f"%{destination_area}%"))

        if departure_date:
            query = query.filter(Ride.departure_date == departure_date)

        if min_available_seats is not None:
            query = query.filter(Ride.available_seats >= min_available_seats)

        if vehicle_type:
            query = query.join(Vehicle).filter(Vehicle.vehicle_type == vehicle_type)

        total_count = query.count()

        # Sorting logic
        sort_attr = Ride.departure_time
        if sort_by == "fare":
            sort_attr = Ride.fare_per_passenger
        elif sort_by == "created_at":
            sort_attr = Ride.created_at
        elif sort_by == "departure_date":
            sort_attr = Ride.departure_date

        order_clause = desc(sort_attr) if order.lower() == "desc" else asc(sort_attr)
        query = query.order_by(order_clause)

        # Pagination
        offset = (page - 1) * size
        rides = query.offset(offset).limit(size).all()

        return rides, total_count

    def soft_delete(self, ride: Ride) -> None:
        ride.is_deleted = True
        ride.deleted_at = datetime.now(timezone.utc)
        self.db.flush()
