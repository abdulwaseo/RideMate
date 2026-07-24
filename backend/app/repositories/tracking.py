from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.tracking import RideTrackingSession
from app.schemas.enums import TrackingStatus


class TrackingRepository:
    """Database operations for RideTrackingSession entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_ride_id(self, ride_id: UUID) -> Optional[RideTrackingSession]:
        return (
            self.db.query(RideTrackingSession)
            .filter(RideTrackingSession.ride_id == ride_id)
            .order_by(RideTrackingSession.started_at.desc())
            .first()
        )

    def get_active_by_ride_id(self, ride_id: UUID) -> Optional[RideTrackingSession]:
        return (
            self.db.query(RideTrackingSession)
            .filter(
                RideTrackingSession.ride_id == ride_id,
                RideTrackingSession.ended_at.is_(None),
            )
            .first()
        )

    def create_session(self, ride_id: UUID, driver_id: UUID) -> RideTrackingSession:
        session = RideTrackingSession(
            ride_id=ride_id,
            driver_id=driver_id,
            current_status=TrackingStatus.PREPARING,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(session)
        self.db.flush()
        return session

    def update_location_state(
        self,
        session: RideTrackingSession,
        *,
        eta_minutes: Optional[float] = None,
        current_eta: Optional[datetime] = None,
        remaining_distance_km: Optional[float] = None,
        total_distance_km: Optional[float] = None,
        progress_percent: Optional[float] = None,
        current_status: Optional[TrackingStatus] = None,
    ) -> RideTrackingSession:
        session.last_location_at = datetime.now(timezone.utc)
        if eta_minutes is not None:
            session.eta_minutes = eta_minutes
        if current_eta is not None:
            session.current_eta = current_eta
        if remaining_distance_km is not None:
            session.remaining_distance_km = remaining_distance_km
        if total_distance_km is not None:
            session.total_distance_km = total_distance_km
        if progress_percent is not None:
            session.progress_percent = progress_percent
        if current_status is not None:
            session.current_status = current_status
        self.db.flush()
        return session

    def update_status(self, session: RideTrackingSession, status: TrackingStatus) -> RideTrackingSession:
        session.current_status = status
        self.db.flush()
        return session

    def close_session(self, session: RideTrackingSession, final_status: TrackingStatus) -> RideTrackingSession:
        session.ended_at = datetime.now(timezone.utc)
        session.current_status = final_status
        self.db.flush()
        return session
