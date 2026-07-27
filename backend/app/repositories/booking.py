from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking, RideRequest
from app.models.ride import Ride
from app.models.user import User
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus, RideStatus


class RideRequestRepository:
    """Database operations for RideRequest entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, request_id: UUID) -> Optional[RideRequest]:
        return self.db.query(RideRequest).options(
            joinedload(RideRequest.passenger),
            joinedload(RideRequest.ride),
        ).filter(
            RideRequest.id == request_id,
            RideRequest.is_deleted == False,
        ).first()

    def get_pending_by_passenger(self, passenger_id: UUID) -> Optional[RideRequest]:
        """Find any pending request submitted by passenger."""
        return self.db.query(RideRequest).filter(
            RideRequest.passenger_id == passenger_id,
            RideRequest.status == BookingStatus.PENDING,
            RideRequest.is_deleted == False,
        ).first()

    def get_accepted_upcoming_request_by_passenger(self, passenger_id: UUID) -> Optional[RideRequest]:
        """Find any accepted request for passenger on an upcoming/active/full ride."""
        return self.db.query(RideRequest).join(Ride, RideRequest.ride_id == Ride.id).filter(
            RideRequest.passenger_id == passenger_id,
            RideRequest.status == BookingStatus.ACCEPTED,
            RideRequest.is_deleted == False,
            Ride.status.in_([RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL]),
        ).first()

    def get_by_passenger_and_ride(self, passenger_id: UUID, ride_id: UUID) -> Optional[RideRequest]:
        """Find request for a specific ride by passenger."""
        return self.db.query(RideRequest).filter(
            RideRequest.passenger_id == passenger_id,
            RideRequest.ride_id == ride_id,
            RideRequest.is_deleted == False,
        ).first()

    def list_by_passenger(self, passenger_id: UUID) -> List[RideRequest]:
        return self.db.query(RideRequest).options(
            joinedload(RideRequest.passenger),
            joinedload(RideRequest.ride),
        ).filter(
            RideRequest.passenger_id == passenger_id,
            RideRequest.is_deleted == False,
        ).order_by(RideRequest.created_at.desc()).all()

    def list_incoming_for_driver(self, driver_profile_id: UUID) -> List[RideRequest]:
        """List incoming requests for all rides published by this driver."""
        return self.db.query(RideRequest).options(
            joinedload(RideRequest.passenger),
            joinedload(RideRequest.ride),
        ).join(Ride).filter(
            Ride.driver_profile_id == driver_profile_id,
            RideRequest.is_deleted == False,
        ).order_by(RideRequest.created_at.desc()).all()

    def create(self, *, ride_id: UUID, passenger_id: UUID, message: Optional[str] = None) -> RideRequest:
        request = RideRequest(
            ride_id=ride_id,
            passenger_id=passenger_id,
            message=message,
            status=BookingStatus.PENDING,
        )
        self.db.add(request)
        self.db.flush()
        return request

    def update_status(self, request: RideRequest, status: BookingStatus) -> RideRequest:
        request.status = status
        self.db.flush()
        return request

    def soft_delete(self, request: RideRequest) -> None:
        request.is_deleted = True
        request.deleted_at = datetime.now(timezone.utc)
        request.status = BookingStatus.CANCELLED
        self.db.flush()


class BookingRepository:
    """Database operations for confirmed Booking entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, booking_id: UUID) -> Optional[Booking]:
        return self.db.query(Booking).options(
            joinedload(Booking.passenger),
            joinedload(Booking.ride),
            joinedload(Booking.request),
        ).filter(
            Booking.id == booking_id,
            Booking.is_deleted == False,
        ).first()

    def get_active_by_passenger(self, passenger_id: UUID) -> Optional[Booking]:
        """Find any active confirmed booking for passenger on an upcoming/active/full ride."""
        return self.db.query(Booking).join(Ride, Booking.ride_id == Ride.id).filter(
            Booking.passenger_id == passenger_id,
            Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
            Booking.is_deleted == False,
            Ride.status.in_([RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL]),
        ).first()

    def list_by_passenger(self, passenger_id: UUID) -> List[Booking]:
        return self.db.query(Booking).options(
            joinedload(Booking.passenger),
            joinedload(Booking.ride),
        ).filter(
            Booking.passenger_id == passenger_id,
            Booking.is_deleted == False,
        ).order_by(Booking.created_at.desc()).all()

    def create(
        self,
        *,
        ride_id: UUID,
        passenger_id: UUID,
        request_id: UUID,
        seat_number: Optional[int] = None,
    ) -> Booking:
        booking = Booking(
            ride_id=ride_id,
            passenger_id=passenger_id,
            request_id=request_id,
            seat_number=seat_number,
            booking_status=ConfirmedBookingStatus.CONFIRMED,
            confirmed_at=datetime.now(timezone.utc),
        )
        self.db.add(booking)
        self.db.flush()
        return booking

    def cancel_booking(self, booking: Booking) -> Booking:
        booking.booking_status = ConfirmedBookingStatus.CANCELLED
        booking.cancelled_at = datetime.now(timezone.utc)
        self.db.flush()
        return booking
