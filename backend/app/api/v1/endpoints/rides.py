from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import VehicleType
from app.schemas.response import ErrorResponse, SuccessResponse
from app.schemas.ride import (
    RideCreate,
    RideResponse,
    RideSummary,
    RideUpdate,
)
from typing import Optional
from app.services.ride import RideService

router = APIRouter()


@router.post(
    "",
    response_model=SuccessResponse[RideResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Publish a New Ride",
    description=(
        "Publishes a new carpool ride offer linking the driver's currently active vehicle. "
        "Requires a verified DriverProfile and at least one Active Vehicle. "
        "A driver may publish only ONE active/upcoming ride at a time ([RIDE_001]). "
        "Departure date & time must be strictly in the future ([RIDE_004])."
    ),
    responses={
        201: {"description": "Ride published successfully"},
        400: {"model": ErrorResponse, "description": "[RIDE_002] No active vehicle or [RIDE_004] Past departure time"},
        403: {"model": ErrorResponse, "description": "[RIDE_003] Driver profile required or verification rejected"},
        409: {"model": ErrorResponse, "description": "[RIDE_001] Driver already has an active ride"},
        422: {"model": ErrorResponse, "description": "[VALIDATION_001] Validation failure"},
    },
)
def publish_ride(
    payload: RideCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride_resp = svc.publish_ride(current_user, payload)

    return SuccessResponse(
        message="Ride published successfully.",
        data=ride_resp,
    )


@router.get(
    "",
    response_model=SuccessResponse[List[RideSummary]],
    status_code=status.HTTP_200_OK,
    summary="Search & Filter Rides",
    description=(
        "Searches upcoming carpool rides with optional filtering by pickup area, "
        "destination area, departure date, vehicle type, and available seats. "
        "Supports pagination (`page`, `size`) and sorting (`sort_by`, `order`)."
    ),
    responses={
        200: {"description": "Rides list retrieved successfully"},
    },
)
def search_rides(
    pickup_area: Optional[str] = Query(None, description="Filter by pickup area/neighborhood"),
    destination_area: Optional[str] = Query(None, description="Filter by destination area/neighborhood"),
    departure_date: Optional[date] = Query(None, description="Filter by departure date (YYYY-MM-DD)"),
    vehicle_type: Optional[VehicleType] = Query(None, description="Filter by vehicle type (Car or Bike)"),
    min_available_seats: Optional[int] = Query(None, ge=1, description="Minimum available seats required"),
    sort_by: str = Query("departure_time", description="Sort by field: departure_time, fare, created_at, departure_date"),
    order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    summaries, total_count = svc.search_rides(
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

    return SuccessResponse(
        message=f"Found {total_count} matching rides.",
        data=summaries,
    )


@router.get(
    "/driver/rides",
    response_model=SuccessResponse[List[RideResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get All Rides Published by Current Driver",
    description="Returns all rides (active, completed, cancelled) published by the currently authenticated driver.",
    responses={
        200: {"description": "Driver rides retrieved"},
    },
)
def get_driver_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    rides = svc.get_driver_rides(current_user)
    return SuccessResponse(
        message=f"Found {len(rides)} ride(s) for this driver.",
        data=rides,
    )


@router.get(
    "/driver/active",
    response_model=SuccessResponse[Optional[RideResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Driver's Current Active Ride",
    description="Returns the driver's current active or upcoming ride, or null if none.",
    responses={
        200: {"description": "Active ride retrieved (or null)"},
    },
)
def get_driver_active_ride(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride = svc.get_driver_active_ride(current_user)
    return SuccessResponse(
        message="Active ride retrieved." if ride else "No active ride.",
        data=ride,
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[RideResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Ride Details",
    description=(
        "Retrieves detailed ride information including pickup/dropoff points, "
        "driver summary, vehicle details, seat availability, fare, and status."
    ),
    responses={
        200: {"description": "Ride details retrieved"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def get_ride(
    id: UUID,
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride_resp = svc.get_ride_detail(id)

    return SuccessResponse(
        message="Ride details retrieved.",
        data=ride_resp,
    )


@router.patch(
    "/{id}",
    response_model=SuccessResponse[RideResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Ride Details",
    description=(
        "Updates an upcoming ride. Only the driver who published the ride can update it. "
        "Completed or Cancelled rides cannot be modified ([RIDE_005])."
    ),
    responses={
        200: {"description": "Ride updated successfully"},
        400: {"model": ErrorResponse, "description": "[RIDE_005] Completed or cancelled ride is immutable"},
        403: {"model": ErrorResponse, "description": "Not authorized to update this ride"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def update_ride(
    id: UUID,
    payload: RideUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride_resp = svc.update_ride(current_user, id, payload)

    return SuccessResponse(
        message="Ride updated successfully.",
        data=ride_resp,
    )


@router.patch(
    "/{id}/cancel",
    response_model=SuccessResponse[RideResponse],
    status_code=status.HTTP_200_OK,
    summary="Cancel Ride",
    description="Cancels an upcoming ride. Updates status to `Cancelled`.",
    responses={
        200: {"description": "Ride cancelled successfully"},
        400: {"model": ErrorResponse, "description": "[RIDE_005] Ride is already completed or cancelled"},
        403: {"model": ErrorResponse, "description": "Not authorized to cancel this ride"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def cancel_ride(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride_resp = svc.cancel_ride(current_user, id)

    return SuccessResponse(
        message="Ride cancelled successfully.",
        data=ride_resp,
    )


@router.patch(
    "/{id}/complete",
    response_model=SuccessResponse[RideResponse],
    status_code=status.HTTP_200_OK,
    summary="Complete Ride",
    description="Marks a ride as completed. Updates status to `Completed`.",
    responses={
        200: {"description": "Ride completed successfully"},
        400: {"model": ErrorResponse, "description": "[RIDE_005] Cancelled ride cannot be completed"},
        403: {"model": ErrorResponse, "description": "Not authorized to complete this ride"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def complete_ride(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    ride_resp = svc.complete_ride(current_user, id)

    return SuccessResponse(
        message="Ride completed successfully.",
        data=ride_resp,
    )


@router.delete(
    "/{id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Ride (Soft Delete)",
    description="Soft-deletes a ride. Only the publishing driver can delete their ride.",
    responses={
        200: {"description": "Ride soft-deleted successfully"},
        403: {"model": ErrorResponse, "description": "Not authorized to delete this ride"},
        404: {"model": ErrorResponse, "description": "Ride not found"},
    },
)
def delete_ride(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RideService(db)
    svc.delete_ride(current_user, id)

    return SuccessResponse(message="Ride deleted successfully.", data=None)
