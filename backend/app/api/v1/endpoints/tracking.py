from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.response import ErrorResponse, SuccessResponse
from app.schemas.tracking import ETAPayload, TrackingSessionResponse
from app.services.ride_tracking_service import RideTrackingService

router = APIRouter()


@router.post(
    "/{ride_id}/start",
    response_model=SuccessResponse[TrackingSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Start Ride Tracking Session",
    description="Driver activates live GPS tracking for an active ride. Creates a RideTrackingSession and broadcasts RIDE_TRACKING_START to ride room.",
    responses={
        201: {"description": "Tracking session started"},
        403: {"model": ErrorResponse, "description": "[DRIVER_004] Driver-only endpoint"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def start_tracking(
    ride_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideTrackingService(db)
    session, _ = svc.start_tracking(current_user, ride_id)
    return SuccessResponse(
        message="Ride tracking session started.",
        data=TrackingSessionResponse.model_validate(session),
    )


@router.get(
    "/{ride_id}/session",
    response_model=SuccessResponse[TrackingSessionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Active Tracking Session",
    description="Returns active tracking session for confirmed driver or passenger of this ride.",
    responses={
        200: {"description": "Tracking session retrieved"},
        403: {"model": ErrorResponse, "description": "[BOOKING_004] Access denied"},
        404: {"model": ErrorResponse, "description": "[TRACK_002] No active session"},
    },
)
def get_active_session(
    ride_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideTrackingService(db)
    session = svc.get_active_session(current_user, ride_id)
    return SuccessResponse(
        message="Active tracking session retrieved.",
        data=TrackingSessionResponse.model_validate(session),
    )


@router.post(
    "/{ride_id}/stop",
    response_model=SuccessResponse[TrackingSessionResponse],
    status_code=status.HTTP_200_OK,
    summary="Stop Ride Tracking Session",
    description="Driver stops live GPS tracking for their ride. Closes the session and broadcasts TRACKING_STOPPED.",
    responses={
        200: {"description": "Tracking session stopped"},
        403: {"model": ErrorResponse, "description": "[RIDE_004] Driver ownership required"},
        404: {"model": ErrorResponse, "description": "[TRACK_001] No active session"},
    },
)
def stop_tracking(
    ride_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideTrackingService(db)
    session = svc.stop_tracking(current_user, ride_id)
    return SuccessResponse(
        message="Ride tracking session stopped.",
        data=TrackingSessionResponse.model_validate(session),
    )


@router.get(
    "/{ride_id}/eta",
    response_model=SuccessResponse[ETAPayload],
    status_code=status.HTTP_200_OK,
    summary="Get Current ETA",
    description="Returns real-time ETA estimation for a confirmed ride participant. Uses last known driver GPS + haversine formula.",
    responses={
        200: {"description": "ETA computed"},
        403: {"model": ErrorResponse, "description": "[BOOKING_004] Participant access only"},
        404: {"model": ErrorResponse, "description": "[TRACK_003] Driver location unavailable"},
    },
)
def get_eta(
    ride_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideTrackingService(db)
    eta = svc.get_current_eta(current_user, ride_id)
    return SuccessResponse(message="ETA computed successfully.", data=eta)
