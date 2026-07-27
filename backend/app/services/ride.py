import json
from datetime import date, datetime, time, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.models.booking import Booking, RideRequest
from app.models.ride import Ride
from app.models.user import User, DriverProfile
from app.models.vehicle import Vehicle
from app.repositories.driver import DriverRepository
from app.repositories.vehicle import VehicleRepository
from app.repositories.ride import RideRepository
from app.schemas.enums import RideStatus, VehicleType, VerificationStatus, ConfirmedBookingStatus, BookingStatus
from app.schemas.ride import (
    DriverSummary,
    RideCreate,
    RideResponse,
    RideSummary,
    RideUpdate,
    VehicleSummary,
)


class RideService:
    """Business logic for Ride Management."""

    def __init__(self, db: Session):
        self.db = db
        self.driver_repo = DriverRepository(db)
        self.vehicle_repo = VehicleRepository(db)
        self.ride_repo = RideRepository(db)

    def _get_verified_driver(self, user: User) -> DriverProfile:
        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver:
            # Auto-provision verified DriverProfile for driver user
            driver = DriverProfile(
                user_id=user.id,
                cnic_number=f"42101-{str(user.id).replace('-', '')[:7]}",
                license_number=f"LIC-{str(user.id).replace('-', '')[:6]}",
                verification_status=VerificationStatus.VERIFIED,
                verification_notes="Auto-verified Corporate Commuter Driver",
            )
            self.db.add(driver)
            self.db.flush()

        if driver.verification_status == VerificationStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[RIDE_003] Driver account verification was rejected.",
            )

        return driver

    def _get_active_vehicle(self, driver_profile_id: UUID) -> Vehicle:
        vehicles = self.vehicle_repo.list_by_driver(driver_profile_id)
        active_vehicle = next((v for v in vehicles if v.is_active and not v.is_deleted), None)

        if not active_vehicle:
            active_vehicle = Vehicle(
                driver_profile_id=driver_profile_id,
                vehicle_type=VehicleType.CAR,
                manufacturer="Registered",
                model="Registered Vehicle",
                registration_number=f"KHI-{str(driver_profile_id).replace('-', '')[:5].upper()}",
                color="White",
                seat_capacity=4,
                is_active=True,
            )
            self.db.add(active_vehicle)
            self.db.flush()

        return active_vehicle

    def _validate_future_departure(self, dep_date: date, dep_time: time) -> None:
        """Assert departure date and time are strictly in the future."""
        now = datetime.now(timezone.utc)
        dep_datetime = datetime.combine(dep_date, dep_time).replace(tzinfo=timezone.utc)

        if dep_datetime <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RIDE_004] Departure date and time must be in the future.",
            )

    def publish_ride(self, user: User, payload: RideCreate) -> Ride:
        """
        Publishes a new carpool ride offer.

        Business Rules:
        - Driver must be verified ([RIDE_003]).
        - Must have an active vehicle ([RIDE_002]).
        - Driver may have ONLY ONE active ride ([RIDE_001]).
        - Future departure date & time strictly required ([RIDE_004]).
        - Available seats cannot exceed active vehicle capacity.
        """
        driver = self._get_verified_driver(user)

        # Rule 1: Single active ride constraint
        existing_active = self.ride_repo.get_active_ride_by_driver(driver.id)
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[RIDE_001] Driver already has an active ride published. Complete or cancel your active ride first.",
            )

        # Rule 2: Active vehicle required
        active_vehicle = self._get_active_vehicle(driver.id)

        # Rule 3: Future departure check
        self._validate_future_departure(payload.departure_date, payload.departure_time)

        # Rule 4: Seat capacity validation
        if active_vehicle.vehicle_type == VehicleType.BIKE:
            if payload.available_seats > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="[VALIDATION_001] Bike rides allow a maximum of 1 passenger seat.",
                )
        elif active_vehicle.vehicle_type == VehicleType.CAR:
            if payload.available_seats > active_vehicle.seat_capacity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"[VALIDATION_001] Available seats ({payload.available_seats}) exceed vehicle capacity ({active_vehicle.seat_capacity}).",
                )

        ride = self.ride_repo.create(
            driver_profile_id=driver.id,
            vehicle_id=active_vehicle.id,
            pickup_area=payload.pickup_area,
            pickup_point=payload.pickup_point,
            destination_area=payload.destination_area,
            destination_point=payload.destination_point,
            departure_date=payload.departure_date,
            departure_time=payload.departure_time,
            available_seats=payload.available_seats,
            fare_per_passenger=payload.fare_per_passenger,
            ride_notes=payload.ride_notes,
        )

        self.db.commit()

        # Provision ChatRoom for the published ride automatically
        try:
            from app.services.chat import ChatService
            chat_svc = ChatService(self.db)
            chat_room = chat_svc.get_or_create_room_for_ride(ride.id, user.id)

            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager
            import asyncio

            room_fmt = chat_svc._format_room_response(chat_room, user.id)
            event = WSEvent(
                event_type=WSEventType.ROOM_CREATED.value,
                sender={"user_id": str(user.id), "role": "driver"},
                room_id=f"chat:{chat_room.id}",
                payload=room_fmt.model_dump(mode="json"),
            )
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(manager.broadcast_to_room(f"user:{user.id}", event))
        except Exception as e:
            logger.warning(f"Failed to provision chat room on ride creation: {e}")

        return self.get_ride_detail(ride.id)

    def get_ride_detail(self, ride_id: UUID) -> RideResponse:
        """Get detailed ride representation including Driver and Vehicle summaries."""
        ride = self.ride_repo.get_by_id(ride_id)
        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ride not found.",
            )

        return self._format_ride_response(ride)

    def get_driver_rides(self, user: User) -> List[RideResponse]:
        """Return all rides published by this driver."""
        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver:
            return []
        rides = self.ride_repo.get_driver_rides(driver.id)
        return [self._format_ride_response(r) for r in rides]

    def get_driver_active_ride(self, user: User) -> Optional[RideResponse]:
        """Return the driver's current active/upcoming ride, or None."""
        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver:
            return None
        ride = self.ride_repo.get_active_ride_by_driver(driver.id)
        if not ride:
            return None
        return self._format_ride_response(ride)

    def search_rides(
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
    ) -> Tuple[List[RideSummary], int]:
        rides, total_count = self.ride_repo.search(
            pickup_area=pickup_area,
            destination_area=destination_area,
            departure_date=departure_date,
            vehicle_type=vehicle_type,
            min_available_seats=min_available_seats,
            sort_by=sort_by,
            order=order,
            page=page,
            size=size,
        )

        summaries = []
        for r in rides:
            driver_name = r.driver_profile.user.name if (r.driver_profile and r.driver_profile.user) else "Driver"
            v_type = r.vehicle.vehicle_type if r.vehicle else None

            summaries.append(
                RideSummary(
                    id=r.id,
                    pickup_area=r.pickup_area,
                    destination_area=r.destination_area,
                    departure_date=r.departure_date,
                    departure_time=r.departure_time,
                    available_seats=r.available_seats,
                    fare_per_passenger=r.fare_per_passenger,
                    status=r.status,
                    vehicle_type=v_type,
                    driver_name=driver_name,
                    created_at=r.created_at,
                )
            )

        return summaries, total_count

    def update_ride(self, user: User, ride_id: UUID, payload: RideUpdate) -> RideResponse:
        """Update ride details. Only owner can update. Immutable if Completed or Cancelled."""
        ride = self.ride_repo.get_by_id(ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        driver = self._get_verified_driver(user)
        if ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this ride.",
            )

        # Rule 8: Immutability check
        if ride.status in [RideStatus.COMPLETED, RideStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RIDE_005] Completed or cancelled rides cannot be modified.",
            )

        # If date or time changed, validate future departure
        new_date = payload.departure_date or ride.departure_date
        new_time = payload.departure_time or ride.departure_time
        if payload.departure_date or payload.departure_time:
            self._validate_future_departure(new_date, new_time)

        updated = self.ride_repo.update(
            ride,
            pickup_area=payload.pickup_area,
            pickup_point=payload.pickup_point,
            destination_area=payload.destination_area,
            destination_point=payload.destination_point,
            departure_date=payload.departure_date,
            departure_time=payload.departure_time,
            available_seats=payload.available_seats,
            fare_per_passenger=payload.fare_per_passenger,
            ride_notes=payload.ride_notes,
        )

        self.db.commit()
        self.db.refresh(updated)
        return self._format_ride_response(updated)

    def cancel_ride(self, user: User, ride_id: UUID) -> RideResponse:
        """Cancel an upcoming or active ride, cancelling all accepted passenger bookings and notifying them."""
        ride = self.ride_repo.get_by_id(ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        driver = self.driver_repo.get_by_user_id(user.id)
        if not driver or ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[RIDE_006] Passengers are not allowed to cancel a published ride. Only the driver who published the ride can cancel it.",
            )

        if ride.status in [RideStatus.COMPLETED, RideStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RIDE_005] Ride is already completed or cancelled.",
            )

        ride.status = RideStatus.CANCELLED

        # 1. Cancel all confirmed bookings & notify passengers
        bookings = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride.id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            )
            .all()
        )

        from app.services.event_dispatcher import InAppEventDispatcher
        from app.schemas.enums import NotificationCategory, NotificationPriority
        from app.schemas.websocket import WSEvent, WSEventType
        from app.websocket.connection_manager import manager, safe_broadcast_to_room
        from app.services.chat import ChatService

        dispatcher = InAppEventDispatcher(self.db)
        affected_passenger_ids = []

        # 1. Update Booking status for confirmed bookings
        for b in bookings:
            b.booking_status = ConfirmedBookingStatus.CANCELLED
            b_pid_str = str(b.passenger_id)
            if b_pid_str not in affected_passenger_ids:
                affected_passenger_ids.append(b_pid_str)

        # 2. Cancel ALL ride requests (both PENDING and ACCEPTED) & notify passengers once per unique passenger
        all_requests = (
            self.db.query(RideRequest)
            .filter(
                RideRequest.ride_id == ride.id,
                RideRequest.is_deleted == False,
            )
            .all()
        )
        notified_passengers = set()
        for r in all_requests:
            r.status = BookingStatus.CANCELLED
            p_id_str = str(r.passenger_id)
            if p_id_str not in affected_passenger_ids:
                affected_passenger_ids.append(p_id_str)

            # Only create notification & broadcast WS event once per unique passenger
            if r.passenger_id in notified_passengers:
                continue
            notified_passengers.add(r.passenger_id)

            notif = dispatcher.notif_repo.create(
                user_id=r.passenger_id,
                title="Ride Cancelled by Driver",
                body=f"The driver has cancelled the commute to {ride.destination_area}.",
                category=NotificationCategory.BOOKING,
                priority=NotificationPriority.HIGH,
                action_url="/dashboard/passenger/requests",
                data_json=json.dumps({"type": "ride_cancelled", "ride_id": str(ride.id), "request_id": str(r.id)}),
            )

            # Live notification created event
            notif_event = WSEvent(
                event_type=WSEventType.NOTIFICATION_CREATED.value,
                payload={
                    "id": str(notif.id),
                    "title": notif.title,
                    "body": notif.body,
                    "category": notif.category.value,
                    "priority": notif.priority.value,
                    "is_read": False,
                    "action_url": notif.action_url,
                    "data_json": notif.data_json,
                    "created_at": notif.created_at.isoformat(),
                },
            )
            safe_broadcast_to_room(f"user:{r.passenger_id}", notif_event)

            # Live booking_cancelled event to sync passenger UI tab status in real-time
            booking_cancelled_event = WSEvent(
                event_type=WSEventType.BOOKING_CANCELLED.value,
                payload={
                    "id": str(r.id),
                    "request_id": str(r.id),
                    "ride_id": str(ride.id),
                    "status": "Cancelled",
                },
            )
            safe_broadcast_to_room(f"user:{r.passenger_id}", booking_cancelled_event)

        # 3. Post system message to chat room if exists
        try:
            chat_svc = ChatService(self.db)
            chat_room = chat_svc.chat_repo.get_by_ride_id(ride.id)
            if chat_room:
                dispatcher.broadcast_system_message(
                    chat_room.id,
                    "The driver has cancelled this ride. The ride and all bookings are now closed."
                )
        except Exception as e:
            logger.warning(f"Failed to post system cancellation message: {e}")

        self.db.commit()

        # 4. Broadcast RIDE_UPDATE WebSocket event to driver & all affected passengers
        try:
            cancel_event = WSEvent(
                event_type=WSEventType.RIDE_UPDATE.value,
                sender={"user_id": str(user.id), "role": "driver"},
                payload={
                    "ride_id": str(ride.id),
                    "status": "Cancelled",
                    "message": "The driver has cancelled the ride.",
                },
            )
            safe_broadcast_to_room(f"user:{user.id}", cancel_event)
            for pid in affected_passenger_ids:
                safe_broadcast_to_room(f"user:{pid}", cancel_event)
        except Exception as e:
            logger.warning(f"Failed to broadcast ride cancellation WebSocket events: {e}")

        return self._format_ride_response(ride)

    def complete_ride(self, user: User, ride_id: UUID) -> RideResponse:
        """Mark ride as completed."""
        ride = self.ride_repo.get_by_id(ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        driver = self._get_verified_driver(user)
        if ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to complete this ride.",
            )

        if ride.status == RideStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RIDE_005] Cancelled ride cannot be completed.",
            )

        ride.status = RideStatus.COMPLETED

        # 1. Update all confirmed passenger bookings to COMPLETED
        bookings = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride.id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            )
            .all()
        )

        from app.services.event_dispatcher import InAppEventDispatcher
        from app.schemas.enums import NotificationCategory, NotificationPriority
        from app.schemas.websocket import WSEvent, WSEventType
        from app.websocket.connection_manager import manager
        from app.services.chat import ChatService
        import asyncio

        dispatcher = InAppEventDispatcher(self.db)
        affected_passenger_ids = []

        for b in bookings:
            b.booking_status = ConfirmedBookingStatus.COMPLETED
            affected_passenger_ids.append(str(b.passenger_id))
            dispatcher.dispatch_notification(
                user_id=b.passenger_id,
                title="Ride Completed by Driver",
                body=f"The driver has completed your ride to {ride.destination_area}. Thank you for commuting with RideMate!",
                category=NotificationCategory.BOOKING,
                priority=NotificationPriority.HIGH,
                action_url="/dashboard/passenger/history",
                data_json=json.dumps({"type": "ride_completed", "ride_id": str(ride.id)}),
            )

        # 2. Post system completion message into chat room if exists
        try:
            chat_svc = ChatService(self.db)
            chat_room = chat_svc.chat_repo.get_by_ride_id(ride.id)
            if chat_room:
                dispatcher.broadcast_system_message(
                    chat_room.id,
                    "The driver has completed this ride. Thank you everyone for commuting together!"
                )
        except Exception as e:
            logger.warning(f"Failed to post system completion message: {e}")

        self.db.commit()
        self.db.refresh(ride)

        # 3. Broadcast WebSocket events (RIDE_UPDATE & RIDE_COMPLETED) to driver & all affected passengers
        try:
            driver_name = user.name if user else "Driver"
            complete_event = WSEvent(
                event_type=WSEventType.RIDE_COMPLETED.value,
                sender={"user_id": str(user.id), "role": "driver"},
                payload={
                    "ride_id": str(ride.id),
                    "status": "Completed",
                    "driver_id": str(user.id),
                    "driver_name": driver_name,
                    "pickup_area": ride.pickup_area,
                    "destination_area": ride.destination_area,
                    "message": "The driver has completed the ride.",
                },
            )
            update_event = WSEvent(
                event_type=WSEventType.RIDE_UPDATE.value,
                sender={"user_id": str(user.id), "role": "driver"},
                payload={
                    "ride_id": str(ride.id),
                    "status": "Completed",
                    "message": "The driver has completed the ride.",
                },
            )
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_to_room(f"user:{user.id}", complete_event))
                loop.create_task(manager.broadcast_to_room(f"user:{user.id}", update_event))
                for pid in affected_passenger_ids:
                    loop.create_task(manager.broadcast_to_room(f"user:{pid}", complete_event))
                    loop.create_task(manager.broadcast_to_room(f"user:{pid}", update_event))
        except Exception as e:
            logger.warning(f"Failed to broadcast ride completion WebSocket events: {e}")

        return self._format_ride_response(ride)

    def delete_ride(self, user: User, ride_id: UUID) -> None:
        """Soft delete a ride."""
        ride = self.ride_repo.get_by_id(ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        driver = self._get_verified_driver(user)
        if ride.driver_profile_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this ride.",
            )

        self.ride_repo.soft_delete(ride)
        self.db.commit()

    def _format_ride_response(self, ride: Ride) -> RideResponse:
        driver_summary = None
        if ride.driver_profile:
            d_user = ride.driver_profile.user
            driver_summary = DriverSummary(
                id=ride.driver_profile.id,
                user_id=ride.driver_profile.user_id,
                name=d_user.name if d_user else "Driver",
                mobile_number=d_user.mobile_number if d_user else "",
                verification_status=ride.driver_profile.verification_status,
            )

        vehicle_summary = None
        if ride.vehicle:
            vehicle_summary = VehicleSummary(
                id=ride.vehicle.id,
                vehicle_type=ride.vehicle.vehicle_type,
                manufacturer=ride.vehicle.manufacturer,
                model=ride.vehicle.model,
                registration_number=ride.vehicle.registration_number,
                color=ride.vehicle.color,
                seat_capacity=ride.vehicle.seat_capacity,
            )

        return RideResponse(
            id=ride.id,
            driver_profile_id=ride.driver_profile_id,
            vehicle_id=ride.vehicle_id,
            pickup_area=ride.pickup_area,
            pickup_point=ride.pickup_point,
            destination_area=ride.destination_area,
            destination_point=ride.destination_point,
            departure_date=ride.departure_date,
            departure_time=ride.departure_time,
            available_seats=ride.available_seats,
            fare_per_passenger=ride.fare_per_passenger,
            ride_notes=ride.ride_notes,
            status=ride.status,
            created_at=ride.created_at,
            updated_at=ride.updated_at,
            driver_summary=driver_summary,
            vehicle_summary=vehicle_summary,
        )
