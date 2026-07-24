import asyncio
from typing import Dict, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.models.user import User
from app.models.ride import Ride
from app.models.booking import Booking, RideRequest
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus
from app.schemas.websocket import WSStatsResponse
from app.websocket.connection_manager import manager


class WebSocketService:
    """
    Business service layer managing WebSocket security authorization rules, rate limits,
    real-time metrics monitoring, and periodic heartbeat garbage collection tasks.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def get_monitoring_stats(self) -> WSStatsResponse:
        """Returns statistics snapshot for system health monitoring."""
        stats = manager.get_stats()
        return WSStatsResponse(**stats)

    def can_user_join_ride_room(self, user: User, ride_id: UUID) -> bool:
        """
        Validates whether a user is authorized to subscribe to real-time events of a ride.
        Allowed if user is:
        1. Driver owner of the ride.
        2. Passenger with accepted ride request or confirmed booking.
        """
        if not self.db:
            return True

        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            return False

        if user.driver_profile and ride.driver_profile_id == user.driver_profile.id:
            return True

        booking = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == ride_id,
                Booking.passenger_id == user.id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
            )
            .first()
        )
        if booking:
            return True

        req = (
            self.db.query(RideRequest)
            .filter(
                RideRequest.ride_id == ride_id,
                RideRequest.passenger_id == user.id,
                RideRequest.status == BookingStatus.ACCEPTED,
            )
            .first()
        )
        return req is not None


_heartbeat_task: Optional[asyncio.Task] = None


async def _heartbeat_cleanup_loop():
    """Background task running periodic garbage collection of inactive WebSocket connections."""
    logger.info("Starting background WebSocket heartbeat monitor task.")
    while True:
        try:
            await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
            cleaned = await manager.clean_stale_connections(settings.WS_HEARTBEAT_TIMEOUT)
            if cleaned > 0:
                logger.info(f"Heartbeat monitor cleaned up {cleaned} stale WebSocket connections.")
        except asyncio.CancelledError:
            logger.info("WebSocket heartbeat monitor task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in WebSocket heartbeat monitor loop: {e}")


def start_heartbeat_monitor():
    """Launches the background heartbeat cleanup loop."""
    global _heartbeat_task
    if _heartbeat_task is None or _heartbeat_task.done():
        _heartbeat_task = asyncio.create_task(_heartbeat_cleanup_loop())


def stop_heartbeat_monitor():
    """Cancels the background heartbeat cleanup loop."""
    global _heartbeat_task
    if _heartbeat_task and not _heartbeat_task.done():
        _heartbeat_task.cancel()
        _heartbeat_task = None
