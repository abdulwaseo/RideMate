from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.driver import (
    DriverProfileCreate,
    DriverProfileResponse,
    DriverProfileUpdate,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.driver import DriverService

router = APIRouter()


@router.post(
    "/profile",
    response_model=SuccessResponse[DriverProfileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Driver Profile",
    description=(
        "Upgrades an authenticated Passenger account into a Driver profile. "
        "Requires valid 13-digit Pakistani CNIC number and driving license registration. "
        "DriverProfile can be created only once per account. "
        "Automatically elevates user's role to `DRIVER`."
    ),
    responses={
        201: {"description": "Driver profile created successfully"},
        409: {"model": ErrorResponse, "description": "[DRIVER_001] Driver profile already exists or CNIC/license is registered"},
        422: {"model": ErrorResponse, "description": "[VALIDATION_001] Validation failure"},
    },
)
def create_driver_profile(
    payload: DriverProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DriverService(db)
    profile = svc.create_driver_profile(current_user, payload)

    return SuccessResponse(
        message="Driver profile created successfully. Role upgraded to DRIVER.",
        data=DriverProfileResponse.model_validate(profile),
    )


@router.get(
    "/profile",
    response_model=SuccessResponse[DriverProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Driver Profile",
    description=(
        "Retrieves the DriverProfile of the currently authenticated user, "
        "including all registered vehicles and verification status."
    ),
    responses={
        200: {"description": "Driver profile retrieved successfully"},
        404: {"model": ErrorResponse, "description": "[DRIVER_002] Driver profile not found"},
    },
)
def get_driver_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DriverService(db)
    profile = svc.get_driver_profile(current_user)

    return SuccessResponse(
        message="Driver profile retrieved.",
        data=DriverProfileResponse.model_validate(profile),
    )


@router.patch(
    "/profile",
    response_model=SuccessResponse[DriverProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Driver Profile",
    description="Updates editable DriverProfile fields (CNIC, driving license number).",
    responses={
        200: {"description": "Driver profile updated successfully"},
        404: {"model": ErrorResponse, "description": "[DRIVER_002] Driver profile not found"},
        409: {"model": ErrorResponse, "description": "[VALIDATION_001] CNIC or License conflict"},
    },
)
def update_driver_profile(
    payload: DriverProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DriverService(db)
    profile = svc.update_driver_profile(current_user, payload)

    return SuccessResponse(
        message="Driver profile updated successfully.",
        data=DriverProfileResponse.model_validate(profile),
    )
