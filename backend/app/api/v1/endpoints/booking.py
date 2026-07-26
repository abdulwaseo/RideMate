from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_driver, get_current_passenger
from app.db.session import get_db
from app.models.user import User
from app.schemas.booking import (
    BookingResponse,
    RideRequestCreate,
    RideRequestResponse,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.booking import BookingService, RideRequestService

# We expose routers for ride-requests, driver-requests, and bookings
requests_router = APIRouter()
driver_requests_router = APIRouter()
bookings_router = APIRouter()


# ------------------------------------------------------------------ #
#  Passenger Ride Request Endpoints                                  #
# ------------------------------------------------------------------ #

@requests_router.post(
    "",
    response_model=SuccessResponse[RideRequestResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Ride Request",
    description=(
        "Submits an unconfirmed seat request for a published ride. "
        "Passengers are allowed ONLY ONE active request or booking at a time ([REQ_001]). "
        "Cannot request your own published ride ([REQ_002]). "
        "Cannot request full, completed, or cancelled rides ([REQ_003])."
    ),
    responses={
        201: {"description": "Ride request submitted successfully"},
        400: {"model": ErrorResponse, "description": "[REQ_002] Cannot request own ride or [REQ_003] Ride not available"},
        409: {"model": ErrorResponse, "description": "[REQ_001] Passenger already has an active request or booking"},
        422: {"model": ErrorResponse, "description": "Validation failure"},
    },
)
def create_ride_request(
    payload: RideRequestCreate,
    current_user: User = Depends(get_current_passenger),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    req_resp = svc.create_request(current_user, payload)

    return SuccessResponse(
        message="Ride request submitted successfully.",
        data=req_resp,
    )


@requests_router.get(
    "/my",
    response_model=SuccessResponse[List[RideRequestResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Ride Requests",
    description="Retrieves all ride requests submitted by the authenticated passenger.",
    responses={
        200: {"description": "Ride requests listed successfully"},
    },
)
def list_my_ride_requests(
    current_user: User = Depends(get_current_passenger),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    requests = svc.list_my_requests(current_user)

    return SuccessResponse(
        message="My ride requests retrieved.",
        data=requests,
    )


@requests_router.delete(
    "/{id}",
    response_model=SuccessResponse[RideRequestResponse],
    status_code=status.HTTP_200_OK,
    summary="Cancel Ride Request",
    description="Cancels a pending or accepted ride request submitted by the passenger.",
    responses={
        200: {"description": "Ride request cancelled successfully"},
        400: {"model": ErrorResponse, "description": "[REQ_005] Only pending or accepted requests can be cancelled"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    },
)
def cancel_ride_request(
    id: UUID,
    current_user: User = Depends(get_current_passenger),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    req_resp = svc.cancel_request(current_user, id)

    return SuccessResponse(
        message="Ride request cancelled.",
        data=req_resp,
    )


# ------------------------------------------------------------------ #
#  Driver Request Management Endpoints                                #
# ------------------------------------------------------------------ #

@driver_requests_router.get(
    "/requests",
    response_model=SuccessResponse[List[RideRequestResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Incoming Requests for Driver",
    description="Retrieves all incoming passenger requests for rides published by the authenticated driver.",
    responses={
        200: {"description": "Driver incoming requests listed"},
        403: {"model": ErrorResponse, "description": "Driver profile required"},
    },
)
def list_driver_incoming_requests(
    current_user: User = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    requests = svc.list_driver_incoming_requests(current_user)

    return SuccessResponse(
        message="Incoming ride requests retrieved.",
        data=requests,
    )


@driver_requests_router.patch(
    "/requests/{id}/accept",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Accept Ride Request",
    description=(
        "Driver accepts a pending ride request. "
        "Creates a confirmed Booking, decrements available seats by 1, "
        "and automatically marks ride FULL if capacity is reached. "
        "Returns the created Booking summary."
    ),
    responses={
        200: {"description": "Request accepted and Booking created"},
        400: {"model": ErrorResponse, "description": "[REQ_003] Ride full or [REQ_005] Request not pending"},
        403: {"model": ErrorResponse, "description": "[REQ_004] Not authorized to manage this ride"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    },
)
def accept_ride_request(
    id: UUID,
    current_user: User = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    booking_resp = svc.accept_request(current_user, id)

    return SuccessResponse(
        message="Ride request accepted. Confirmed booking generated.",
        data=booking_resp,
    )


@driver_requests_router.patch(
    "/requests/{id}/reject",
    response_model=SuccessResponse[RideRequestResponse],
    status_code=status.HTTP_200_OK,
    summary="Reject Ride Request",
    description="Driver rejects a pending ride request.",
    responses={
        200: {"description": "Request rejected successfully"},
        400: {"model": ErrorResponse, "description": "[REQ_005] Request not pending"},
        403: {"model": ErrorResponse, "description": "[REQ_004] Not authorized"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    },
)
def reject_ride_request(
    id: UUID,
    current_user: User = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    svc = RideRequestService(db)
    req_resp = svc.reject_request(current_user, id)

    return SuccessResponse(
        message="Ride request rejected.",
        data=req_resp,
    )


# ------------------------------------------------------------------ #
#  Passenger Bookings Endpoints                                       #
# ------------------------------------------------------------------ #

@bookings_router.get(
    "/my",
    response_model=SuccessResponse[List[BookingResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Confirmed Bookings",
    description="Retrieves all confirmed seat bookings held by the authenticated passenger.",
    responses={
        200: {"description": "Bookings listed successfully"},
    },
)
def list_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = BookingService(db)
    bookings = svc.list_my_bookings(current_user)

    return SuccessResponse(
        message="My confirmed bookings retrieved.",
        data=bookings,
    )


@bookings_router.patch(
    "/{id}/cancel",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Cancel Confirmed Booking",
    description=(
        "Passenger cancels a confirmed booking. "
        "Sets booking_status to CANCELLED and automatically frees 1 seat. "
        "If ride status was FULL, reverts ride status back to UPCOMING."
    ),
    responses={
        200: {"description": "Booking cancelled and seat freed"},
        400: {"model": ErrorResponse, "description": "[BOOKING_001] Booking already cancelled"},
        404: {"model": ErrorResponse, "description": "Booking not found"},
    },
)
def cancel_booking(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = BookingService(db)
    booking_resp = svc.cancel_booking(current_user, id)

    return SuccessResponse(
        message="Booking cancelled successfully. Seat freed for other commuters.",
        data=booking_resp,
    )
