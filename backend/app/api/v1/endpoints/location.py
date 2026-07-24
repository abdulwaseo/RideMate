from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_driver, get_db
from app.models.user import User
from app.schemas.location import DriverLocationResponse, LocationUpdatePayload
from app.services.location import LocationService

router = APIRouter()


@router.post(
    "/update",
    response_model=DriverLocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update driver live GPS telemetry",
)
def update_location(
    payload: LocationUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """
    Publish live GPS coordinates (latitude, longitude, heading, speed, accuracy).
    Only authenticated drivers can post location telemetry.
    """
    service = LocationService(db)
    return service.update_location(current_user, payload)


@router.get(
    "/current",
    response_model=DriverLocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get driver's own live location",
)
def get_current_location(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Returns authenticated driver's last known live location."""
    service = LocationService(db)
    return service.get_current_driver_location(current_user)


@router.get(
    "/ride/{ride_id}",
    response_model=DriverLocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get driver location for active ride",
)
def get_ride_location(
    ride_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns live location for an active ride.
    Accessible by ride driver or passengers with an accepted/confirmed booking.
    """
    service = LocationService(db)
    return service.get_ride_location(current_user, ride_id)


@router.delete(
    "/stop",
    status_code=status.HTTP_200_OK,
    summary="Stop live location tracking",
)
def stop_location_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Stops live location tracking for authenticated driver."""
    service = LocationService(db)
    success = service.stop_tracking(current_user)
    return {"status": "stopped", "success": success}
