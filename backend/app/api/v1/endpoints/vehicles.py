from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.response import ErrorResponse, SuccessResponse
from app.schemas.vehicle import VehicleCreate, VehicleResponse, VehicleUpdate
from app.services.vehicle import VehicleService

router = APIRouter()


@router.post(
    "",
    response_model=SuccessResponse[VehicleResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add New Vehicle",
    description=(
        "Registers a new vehicle (Car or Bike) under the authenticated driver's profile. "
        "First vehicle registered is set active by default. "
        "Enforces seat capacity limits (Bike: max 1 passenger; Car: 1–7 passengers)."
    ),
    responses={
        201: {"description": "Vehicle added successfully"},
        403: {"model": ErrorResponse, "description": "[DRIVER_002] Driver profile required"},
        409: {"model": ErrorResponse, "description": "[VEHICLE_002] Vehicle registration number already registered"},
        422: {"model": ErrorResponse, "description": "[VALIDATION_001] Validation failure"},
    },
)
def create_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    vehicle = svc.create_vehicle(current_user, payload)

    return SuccessResponse(
        message="Vehicle registered successfully.",
        data=VehicleResponse.model_validate(vehicle),
    )


@router.get(
    "",
    response_model=SuccessResponse[List[VehicleResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Driver Vehicles",
    description="Retrieves all active and inactive vehicles owned by the authenticated driver.",
    responses={
        200: {"description": "Vehicles listed successfully"},
        403: {"model": ErrorResponse, "description": "[DRIVER_002] Driver profile required"},
    },
)
def list_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    vehicles = svc.list_vehicles(current_user)

    return SuccessResponse(
        message="Vehicles retrieved.",
        data=[VehicleResponse.model_validate(v) for v in vehicles],
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[VehicleResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Vehicle Detail",
    description="Retrieves specs for a specific vehicle by ID.",
    responses={
        200: {"description": "Vehicle details retrieved"},
        404: {"model": ErrorResponse, "description": "[VEHICLE_001] Vehicle not found"},
    },
)
def get_vehicle(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    vehicle = svc.get_vehicle(current_user, id)

    return SuccessResponse(
        message="Vehicle details retrieved.",
        data=VehicleResponse.model_validate(vehicle),
    )


@router.patch(
    "/{id}",
    response_model=SuccessResponse[VehicleResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Vehicle",
    description="Updates vehicle attributes (model, color, registration number, seat capacity).",
    responses={
        200: {"description": "Vehicle updated successfully"},
        404: {"model": ErrorResponse, "description": "[VEHICLE_001] Vehicle not found"},
        409: {"model": ErrorResponse, "description": "[VEHICLE_002] Registration number conflict"},
    },
)
def update_vehicle(
    id: UUID,
    payload: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    vehicle = svc.update_vehicle(current_user, id, payload)

    return SuccessResponse(
        message="Vehicle updated successfully.",
        data=VehicleResponse.model_validate(vehicle),
    )


@router.patch(
    "/{id}/activate",
    response_model=SuccessResponse[VehicleResponse],
    status_code=status.HTTP_200_OK,
    summary="Activate Vehicle",
    description=(
        "Marks the specified vehicle as active for publishing rides. "
        "Automatically deactivates any previously active vehicle."
    ),
    responses={
        200: {"description": "Vehicle activated successfully"},
        404: {"model": ErrorResponse, "description": "[VEHICLE_001] Vehicle not found"},
    },
)
def activate_vehicle(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    vehicle = svc.activate_vehicle(current_user, id)

    return SuccessResponse(
        message="Vehicle activated for publishing rides.",
        data=VehicleResponse.model_validate(vehicle),
    )


@router.delete(
    "/{id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Vehicle (Soft Delete)",
    description=(
        "Soft-deletes a vehicle from the driver's garage. "
        "Cannot delete the currently active vehicle if multiple vehicles exist."
    ),
    responses={
        200: {"description": "Vehicle soft-deleted successfully"},
        400: {"model": ErrorResponse, "description": "[VEHICLE_003] Cannot delete active vehicle"},
        404: {"model": ErrorResponse, "description": "[VEHICLE_001] Vehicle not found"},
    },
)
def delete_vehicle(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = VehicleService(db)
    svc.delete_vehicle(current_user, id)

    return SuccessResponse(message="Vehicle soft deleted successfully.", data=None)
