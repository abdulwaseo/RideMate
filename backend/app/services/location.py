from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.ride import Ride, RideStatus
from app.models.booking import Booking, RideRequest
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus
from app.models.location import DriverLocation
from app.repositories.location import LocationRepository
from app.schemas.location import LocationUpdatePayload


class LocationService:
    """
    Business service enforcing authorization rules for Driver Location updates and Passenger tracking.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = LocationRepository(db)

    def update_location(
        self, current_user: User, payload: LocationUpdatePayload
    ) -> DriverLocation:
        """
        Only authenticated drivers can publish location coordinates.
        If ride_id is attached, validates driver ownership of active ride.
        """
        if not current_user.driver_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[DRIVER_004] Only registered drivers can publish live location updates.",
            )

        if payload.ride_id:
            ride = self.db.query(Ride).filter(Ride.id == payload.ride_id).first()
            if not ride:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="[RIDE_006] Specified ride corridor does not exist.",
                )
            if ride.driver_profile_id != current_user.driver_profile.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="[RIDE_004] Drivers can only publish location for their own active ride.",
                )
            if ride.status in (RideStatus.COMPLETED, RideStatus.CANCELLED):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="[RIDE_005] Cannot update location for completed or cancelled rides.",
                )

        record = self.repo.upsert_driver_location(
            driver_id=current_user.id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            ride_id=payload.ride_id,
            heading=payload.heading,
            speed=payload.speed,
            accuracy=payload.accuracy,
        )
        self.db.commit()
        return record

    def get_current_driver_location(self, current_user: User) -> DriverLocation:
        """Retrieves driver's own last known location."""
        record = self.repo.get_latest_by_driver(current_user.id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[USER_001] No live location recorded for driver.",
            )
        return record

    def get_ride_location(self, current_user: User, ride_id: UUID) -> DriverLocation:
        """
        Retrieves driver location for a ride.
        Passengers can view location ONLY if they have an accepted/confirmed booking or request.
        """
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[RIDE_006] Ride not found.",
            )

        is_driver = current_user.driver_profile and ride.driver_profile_id == current_user.driver_profile.id

        is_accepted_passenger = False
        if not is_driver:
            # Check confirmed booking
            booking = (
                self.db.query(Booking)
                .filter(
                    Booking.ride_id == ride_id,
                    Booking.passenger_id == current_user.id,
                    Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                )
                .first()
            )
            if booking:
                is_accepted_passenger = True
            else:
                # Check accepted ride request
                req = (
                    self.db.query(RideRequest)
                    .filter(
                        RideRequest.ride_id == ride_id,
                        RideRequest.passenger_id == current_user.id,
                        RideRequest.status == BookingStatus.ACCEPTED,
                    )
                    .first()
                )
                if req:
                    is_accepted_passenger = True

        if not is_driver and not is_accepted_passenger:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[BOOKING_004] Passengers can view live tracking only after their ride booking is accepted.",
            )

        record = self.repo.get_latest_by_ride(ride_id)
        if not record:
            # Fallback to latest driver location
            driver_user_id = ride.driver_profile.user_id if ride.driver_profile else None
            if driver_user_id:
                record = self.repo.get_latest_by_driver(driver_user_id)

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[SYSTEM_003] Live location currently unavailable for this ride.",
            )

        return record

    def stop_tracking(self, current_user: User) -> bool:
        """Stops location updates and removes active telemetry for driver."""
        success = self.repo.delete_by_driver(current_user.id)
        self.db.commit()
        return success
