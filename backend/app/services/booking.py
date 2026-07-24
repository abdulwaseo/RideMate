from datetime import datetime, timezone
from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking, RideRequest
from app.models.ride import Ride
from app.models.user import User
from app.repositories.booking import BookingRepository, RideRequestRepository
from app.repositories.driver import DriverRepository
from app.repositories.ride import RideRepository
from app.schemas.booking import (
    BookingResponse,
    PassengerSummary,
    RideBrief,
    RideRequestCreate,
    RideRequestResponse,
)
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus, RideStatus


class RideCapacityService:
    """Helper service managing ride capacity calculations and status transitions."""

    @staticmethod
    def decrement_seat(db: Session, ride: Ride) -> None:
        """Decrement available seats by 1 and mark FULL if capacity reached."""
        if ride.available_seats > 0:
            ride.available_seats -= 1

        if ride.available_seats <= 0:
            ride.status = RideStatus.FULL

        db.flush()

    @staticmethod
    def increment_seat(db: Session, ride: Ride) -> None:
        """Increment available seats by 1 and revert to UPCOMING if previously FULL."""
        ride.available_seats += 1

        if ride.status == RideStatus.FULL and ride.available_seats > 0:
            ride.status = RideStatus.UPCOMING

        db.flush()


class RideRequestService:
    """Business logic for passenger RideRequest creation and driver reviews."""

    def __init__(self, db: Session):
        self.db = db
        self.req_repo = RideRequestRepository(db)
        self.booking_repo = BookingRepository(db)
        self.ride_repo = RideRepository(db)
        self.driver_repo = DriverRepository(db)

    def create_request(self, user: User, payload: RideRequestCreate) -> RideRequestResponse:
        """
        Creates a new ride request for a passenger.

        Business Rules:
        - Ride must exist and be in UPCOMING status ([REQ_003]).
        - Passenger cannot request their own published ride ([REQ_002]).
        - Single active request/booking rule ([REQ_001]).
        - Duplicate requests for the same ride forbidden.
        """
        ride = self.ride_repo.get_by_id(payload.ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        # Rule: Cannot request own ride
        driver_profile = self.driver_repo.get_by_user_id(user.id)
        if driver_profile and ride.driver_profile_id == driver_profile.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_002] You cannot request a seat on your own published ride.",
            )

        # Rule: Ride availability
        if ride.status != RideStatus.UPCOMING or ride.available_seats <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_003] This ride is full, completed, or cancelled and cannot accept requests.",
            )

        # Rule: Single active request / booking
        pending_req = self.req_repo.get_pending_by_passenger(user.id)
        active_booking = self.booking_repo.get_active_by_passenger(user.id)
        if pending_req or active_booking:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[REQ_001] You already have an active ride request or confirmed booking.",
            )

        # Rule: Duplicate request check
        existing_same_ride = self.req_repo.get_by_passenger_and_ride(user.id, ride.id)
        if existing_same_ride and existing_same_ride.status == BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[REQ_001] You have already submitted a pending request for this ride.",
            )

        request = self.req_repo.create(
            ride_id=ride.id,
            passenger_id=user.id,
            message=payload.message,
        )

        self.db.commit()
        res = self._format_request_response(request)

        # Broadcast BOOKING_REQUESTED WebSocket event
        try:
            import asyncio
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager

            driver_user_id = ride.driver_profile.user.id if (ride.driver_profile and ride.driver_profile.user) else None
            evt = WSEvent(
                event_type=WSEventType.BOOKING_REQUESTED.value,
                payload=res.model_dump(mode="json"),
            )
            loop = asyncio.get_event_loop()
            if loop.is_running():
                if driver_user_id:
                    loop.create_task(manager.broadcast_to_room(f"user:{driver_user_id}", evt))
                loop.create_task(manager.broadcast_to_room(f"user:{user.id}", evt))
        except Exception:
            pass

        return res

    def list_my_requests(self, user: User) -> List[RideRequestResponse]:
        """List all requests submitted by current passenger."""
        requests = self.req_repo.list_by_passenger(user.id)
        return [self._format_request_response(r) for r in requests]

    def cancel_request(self, user: User, request_id: UUID) -> RideRequestResponse:
        """Cancel a pending ride request by passenger."""
        req = self.req_repo.get_by_id(request_id)
        if not req or req.passenger_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

        if req.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_005] Only pending requests can be cancelled.",
            )

        updated = self.req_repo.update_status(req, BookingStatus.CANCELLED)
        self.db.commit()
        res = self._format_request_response(updated)

        # Broadcast BOOKING_CANCELLED WebSocket event
        try:
            import asyncio
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager

            driver_user_id = req.ride.driver_profile.user.id if (req.ride and req.ride.driver_profile and req.ride.driver_profile.user) else None
            evt = WSEvent(
                event_type=WSEventType.BOOKING_CANCELLED.value,
                payload=res.model_dump(mode="json"),
            )
            loop = asyncio.get_event_loop()
            if loop.is_running():
                if driver_user_id:
                    loop.create_task(manager.broadcast_to_room(f"user:{driver_user_id}", evt))
                loop.create_task(manager.broadcast_to_room(f"user:{user.id}", evt))
        except Exception:
            pass

        return res

    def list_driver_incoming_requests(self, user: User) -> List[RideRequestResponse]:
        """List incoming requests for all rides published by this driver."""
        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver profile required.")

        requests = self.req_repo.list_incoming_for_driver(driver.id)
        return [self._format_request_response(r) for r in requests]

    def accept_request(self, user: User, request_id: UUID) -> BookingResponse:
        """
        Driver accepts a pending ride request.
        Creates a confirmed Booking, decrements available seats, updates status to ACCEPTED.
        """
        req = self.req_repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver or req.ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[REQ_004] You are not authorized to accept requests for this ride.",
            )

        if req.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_005] Request is not in Pending status.",
            )

        if req.ride.available_seats <= 0 or req.ride.status not in [RideStatus.UPCOMING, RideStatus.FULL]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_003] Ride has no available seats remaining.",
            )

        try:
            # 1. Update request status
            self.req_repo.update_status(req, BookingStatus.ACCEPTED)

            # 2. Create Booking
            booking = self.booking_repo.create(
                ride_id=req.ride_id,
                passenger_id=req.passenger_id,
                request_id=req.id,
            )

            # 3. Recalculate capacity
            RideCapacityService.decrement_seat(self.db, req.ride)

            # 4. Automatically create/retrieve ChatRoom and dispatch events
            from app.services.chat import ChatService
            from app.services.event_dispatcher import InAppEventDispatcher
            from app.schemas.enums import NotificationCategory, NotificationPriority
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager

            dispatcher = InAppEventDispatcher(self.db)
            chat_svc = ChatService(self.db)
            chat_room = chat_svc.get_or_create_room_for_ride(req.ride_id, user.id)

            passenger_name = req.passenger.name if req.passenger else "A passenger"
            dispatcher.broadcast_system_message(chat_room.id, f"Passenger {passenger_name} joined the ride.")

            dispatcher.dispatch_notification(
                user_id=req.passenger_id,
                title="Ride Request Accepted",
                body=f"Your ride request for commute to {req.ride.destination_area} was accepted by the driver.",
                category=NotificationCategory.BOOKING,
                priority=NotificationPriority.HIGH,
            )

            dispatcher.dispatch_notification(
                user_id=user.id,
                title="Passenger Joined",
                body=f"{passenger_name} has joined your ride.",
                category=NotificationCategory.RIDE,
                priority=NotificationPriority.MEDIUM,
            )

            self.db.commit()
            self.db.refresh(booking)
            booking_res = BookingService._format_booking_response(booking)

            # Format created room response for WebSocket broadcast
            try:
                import asyncio
                room_formatted = chat_svc._format_room_response(chat_room, user.id)
                room_payload = room_formatted.model_dump(mode="json")
                room_event = WSEvent(
                    event_type=WSEventType.ROOM_CREATED.value,
                    payload=room_payload,
                )

                booking_event_payload = booking_res.model_dump(mode="json")
                booking_event_payload["request_id"] = str(req.id)
                booking_event_payload["status"] = "Accepted"
                booking_event = WSEvent(
                    event_type=WSEventType.BOOKING_ACCEPTED.value,
                    payload=booking_event_payload,
                )

                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(manager.broadcast_to_room(f"user:{user.id}", room_event))
                    loop.create_task(manager.broadcast_to_room(f"user:{req.passenger_id}", room_event))
                    loop.create_task(manager.broadcast_to_room(f"user:{user.id}", booking_event))
                    loop.create_task(manager.broadcast_to_room(f"user:{req.passenger_id}", booking_event))
            except Exception:
                pass

            return booking_res
        except Exception as err:
            self.db.rollback()
            if isinstance(err, HTTPException):
                raise err
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to accept booking and create chat room: {str(err)}",
            )

    def reject_request(self, user: User, request_id: UUID) -> RideRequestResponse:
        """Driver rejects a pending ride request."""
        req = self.req_repo.get_by_id(request_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver or req.ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[REQ_004] You are not authorized to reject requests for this ride.",
            )

        if req.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[REQ_005] Request is not in Pending status.",
            )

        updated = self.req_repo.update_status(req, BookingStatus.REJECTED)

        from app.services.event_dispatcher import InAppEventDispatcher
        from app.schemas.enums import NotificationCategory, NotificationPriority
        dispatcher = InAppEventDispatcher(self.db)
        dispatcher.dispatch_notification(
            user_id=req.passenger_id,
            title="Ride Request Declined",
            body=f"Your request for ride to {req.ride.destination_area} was declined by the driver.",
            category=NotificationCategory.BOOKING,
            priority=NotificationPriority.MEDIUM,
        )

        self.db.commit()
        res = self._format_request_response(updated)

        # Broadcast BOOKING_REJECTED WebSocket event
        try:
            import asyncio
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager

            evt = WSEvent(
                event_type=WSEventType.BOOKING_REJECTED.value,
                payload=res.model_dump(mode="json"),
            )
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_to_room(f"user:{user.id}", evt))
                loop.create_task(manager.broadcast_to_room(f"user:{req.passenger_id}", evt))
        except Exception:
            pass

        return res

    def _format_request_response(self, req: RideRequest) -> RideRequestResponse:
        passenger_summary = None
        if req.passenger:
            passenger_summary = PassengerSummary(
                id=req.passenger.id,
                name=req.passenger.name,
                mobile_number=req.passenger.mobile_number,
            )

        ride_summary = None
        if req.ride:
            ride_summary = RideBrief(
                id=req.ride.id,
                pickup_area=req.ride.pickup_area,
                destination_area=req.ride.destination_area,
                departure_date=str(req.ride.departure_date),
                departure_time=str(req.ride.departure_time),
                fare_per_passenger=req.ride.fare_per_passenger,
                status=req.ride.status,
            )

        return RideRequestResponse(
            id=req.id,
            ride_id=req.ride_id,
            passenger_id=req.passenger_id,
            message=req.message,
            status=req.status,
            created_at=req.created_at,
            updated_at=req.updated_at,
            passenger_summary=passenger_summary,
            ride_summary=ride_summary,
        )


class BookingService:
    """Business logic for confirmed passenger Booking management."""

    def __init__(self, db: Session):
        self.db = db
        self.booking_repo = BookingRepository(db)

    def list_my_bookings(self, user: User) -> List[BookingResponse]:
        """List confirmed bookings held by current passenger."""
        bookings = self.booking_repo.list_by_passenger(user.id)
        return [self._format_booking_response(b) for b in bookings]

    def cancel_booking(self, user: User, booking_id: UUID) -> BookingResponse:
        """
        Passenger cancels a confirmed booking.
        Updates status to CANCELLED, sets cancelled_at=now, and automatically frees 1 seat.
        """
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking or booking.passenger_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[BOOKING_001] Booking not found or unauthorized.",
            )

        if booking.booking_status == ConfirmedBookingStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[BOOKING_001] Booking is already cancelled.",
            )

        cancelled = self.booking_repo.cancel_booking(booking)

        # Free 1 seat and update ride status
        if booking.ride:
            RideCapacityService.increment_seat(self.db, booking.ride)

        self.db.commit()
        return self._format_booking_response(cancelled)

    @staticmethod
    def _format_booking_response(booking: Booking) -> BookingResponse:
        passenger_summary = None
        if booking.passenger:
            passenger_summary = PassengerSummary(
                id=booking.passenger.id,
                name=booking.passenger.name,
                mobile_number=booking.passenger.mobile_number,
            )

        ride_summary = None
        if booking.ride:
            ride_summary = RideBrief(
                id=booking.ride.id,
                pickup_area=booking.ride.pickup_area,
                destination_area=booking.ride.destination_area,
                departure_date=str(booking.ride.departure_date),
                departure_time=str(booking.ride.departure_time),
                fare_per_passenger=booking.ride.fare_per_passenger,
                status=booking.ride.status,
            )

        return BookingResponse(
            id=booking.id,
            ride_id=booking.ride_id,
            passenger_id=booking.passenger_id,
            request_id=booking.request_id,
            seat_number=booking.seat_number,
            booking_status=booking.booking_status,
            confirmed_at=booking.confirmed_at,
            cancelled_at=booking.cancelled_at,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            passenger_summary=passenger_summary,
            ride_summary=ride_summary,
        )
