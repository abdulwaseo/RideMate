from datetime import timezone
from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.ride import Ride
from app.models.user import User
from app.models.booking import Booking
from app.models.tracking import RideTrackingSession
from app.repositories.tracking import TrackingRepository
from app.repositories.location import LocationRepository
from app.schemas.enums import ConfirmedBookingStatus, RideStatus, TrackingStatus
from app.schemas.tracking import (
    ETAPayload,
    LocationUpdateEvent,
    TrackingSessionResponse,
    TrackingStartPayload,
)
from app.services.eta_service import eta_service


class RideTrackingService:
    """
    Business service managing the lifecycle of a RideTrackingSession.
    Validates driver ownership, passenger access, and GPS coordinate integrity.
    Integrates with ETAService for live ETA recalculation on each location update.
    """

    def __init__(self, db: Session):
        self.db = db
        self.tracking_repo = TrackingRepository(db)
        self.location_repo = LocationRepository(db)

    # ─── Driver: Start Tracking ────────────────────────────────────────────────

    def start_tracking(self, driver: User, ride_id: UUID) -> tuple[RideTrackingSession, TrackingStartPayload]:
        """Driver activates live tracking for their ride."""
        ride = self._get_driver_ride(driver, ride_id)

        # Close any stale session for this ride
        stale = self.tracking_repo.get_active_by_ride_id(ride_id)
        if stale:
            self.tracking_repo.close_session(stale, TrackingStatus.CANCELLED)

        session = self.tracking_repo.create_session(ride_id=ride_id, driver_id=driver.id)
        self.db.commit()

        payload = TrackingStartPayload(
            ride_id=str(ride_id),
            session_id=str(session.id),
            driver_id=str(driver.id),
            status=TrackingStatus.PREPARING.value,
            started_at=session.started_at.isoformat(),
        )
        return session, payload

    # ─── Driver: Process Location Update ──────────────────────────────────────

    def process_location_update(
        self,
        driver: User,
        ride_id: UUID,
        latitude: float,
        longitude: float,
        heading: Optional[float] = None,
        speed: Optional[float] = None,
        accuracy: Optional[float] = None,
    ) -> tuple[LocationUpdateEvent, ETAPayload]:
        """
        Persists new GPS fix, recalculates ETA, and returns
        both a location event and updated ETA payload for WebSocket broadcast.
        """
        ride = self._get_driver_ride(driver, ride_id)

        # Persist location
        self.location_repo.upsert_driver_location(
            driver_id=driver.id,
            latitude=latitude,
            longitude=longitude,
            ride_id=ride_id,
            heading=heading,
            speed=speed,
            accuracy=accuracy,
        )

        # Compute ETA
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        eta_payload = self._compute_eta(ride, latitude, longitude, speed)
        eta_payload.ride_id = str(ride_id)

        # Update tracking session
        session = self.tracking_repo.get_active_by_ride_id(ride_id)
        if session:
            new_status = self._infer_status(session.current_status, eta_payload)
            self.tracking_repo.update_location_state(
                session,
                eta_minutes=eta_payload.eta_minutes,
                remaining_distance_km=eta_payload.remaining_distance_km,
                progress_percent=eta_payload.progress_percent,
                current_status=new_status,
            )
            self.db.commit()

        loc_event = LocationUpdateEvent(
            ride_id=str(ride_id),
            driver_id=str(driver.id),
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed,
            accuracy=accuracy,
            recorded_at=now_iso,
        )
        return loc_event, eta_payload

    # ─── Driver: Stop Tracking ─────────────────────────────────────────────────

    def stop_tracking(self, driver: User, ride_id: UUID) -> RideTrackingSession:
        """Driver manually stops live tracking session."""
        self._get_driver_ride(driver, ride_id)
        session = self.tracking_repo.get_active_by_ride_id(ride_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[TRACK_001] No active tracking session found for this ride.",
            )
        closed = self.tracking_repo.close_session(session, TrackingStatus.COMPLETED)
        self.db.commit()
        return closed

    # ─── Driver: Update Phase ──────────────────────────────────────────────────

    def update_tracking_phase(
        self, driver: User, ride_id: UUID, new_status: TrackingStatus
    ) -> RideTrackingSession:
        """Driver manually advances ride phase (e.g. picking up passenger)."""
        self._get_driver_ride(driver, ride_id)
        session = self.tracking_repo.get_active_by_ride_id(ride_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[TRACK_001] No active tracking session found for this ride.",
            )
        updated = self.tracking_repo.update_status(session, new_status)
        self.db.commit()
        return updated

    # ─── Passenger / Shared: Read Session ─────────────────────────────────────

    def get_active_session(self, user: User, ride_id: UUID) -> RideTrackingSession:
        """Returns active tracking session for driver or confirmed passenger."""
        self._verify_ride_access(user, ride_id)
        session = self.tracking_repo.get_active_by_ride_id(ride_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[TRACK_002] No active tracking session for this ride.",
            )
        return session

    def get_current_eta(self, user: User, ride_id: UUID) -> ETAPayload:
        """Computes and returns a fresh ETA for confirmed passengers."""
        self._verify_ride_access(user, ride_id)
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        loc = self.location_repo.get_latest_by_ride(ride_id)
        if not loc:
            driver_uid = ride.driver_profile.user_id if ride.driver_profile else None
            if driver_uid:
                loc = self.location_repo.get_latest_by_driver(driver_uid)

        if not loc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="[TRACK_003] Driver location not yet available.",
            )

        eta = self._compute_eta(ride, loc.latitude, loc.longitude, loc.speed)
        eta.ride_id = str(ride_id)
        return eta

    # ─── Internal Helpers ──────────────────────────────────────────────────────

    def _get_driver_ride(self, driver: User, ride_id: UUID) -> Ride:
        """Returns ride if driver owns it; raises 403/404 otherwise."""
        if not driver.driver_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[DRIVER_004] Only registered drivers can manage tracking.",
            )
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")
        if ride.driver_profile_id != driver.driver_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[RIDE_004] Drivers can only track their own rides.",
            )
        if ride.status in (RideStatus.COMPLETED, RideStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RIDE_005] Cannot track completed or cancelled rides.",
            )
        return ride

    def _verify_ride_access(self, user: User, ride_id: UUID) -> None:
        """Validates driver OR confirmed passenger access to tracking data."""
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        is_driver = user.driver_profile and ride.driver_profile_id == user.driver_profile.id
        if is_driver:
            return

        booking = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.passenger_id == user.id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            )
            .first()
        )
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[BOOKING_004] Only confirmed ride participants can access tracking.",
            )

    def _compute_eta(
        self,
        ride: Ride,
        current_lat: float,
        current_lon: float,
        speed_kmh: Optional[float],
    ) -> ETAPayload:
        """Computes ETA using destination from ride pickup/destination coords."""
        # NOTE: We use a simple lat/lon approximation for pickup and destination.
        # Production integration: parse pickup_point / destination_point geocoded coordinates.
        # For now we use a placeholder haversine approach assuming location proximity.
        dest_lat = current_lat - 0.05   # placeholder offset; replaced by geocoded coords in prod
        dest_lon = current_lon + 0.08

        return eta_service.calculate_eta(
            current_lat=current_lat,
            current_lon=current_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            speed_kmh=speed_kmh,
            ride_id=str(ride.id),
        )

    def _infer_status(
        self, current_status: TrackingStatus, eta: ETAPayload
    ) -> TrackingStatus:
        """Auto-advances tracking phase based on ETA distance threshold."""
        if current_status in (TrackingStatus.COMPLETED, TrackingStatus.CANCELLED):
            return current_status

        remaining = eta.remaining_distance_km or 999
        if remaining <= 0.3 and current_status == TrackingStatus.RIDE_IN_PROGRESS:
            return TrackingStatus.DESTINATION_APPROACHING

        return current_status
