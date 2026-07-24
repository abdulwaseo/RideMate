from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rating import (
    RatingCreate,
    RatingResponse,
    RatingUpdate,
    UserRatingSummary,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.rating import RatingService

router = APIRouter()


@router.post(
    "",
    response_model=SuccessResponse[RatingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Rating & Review",
    description=(
        "Submits a rating and review for a completed ride. "
        "Score must be between 1 and 5. Self-rating is forbidden ([RATING_002]). "
        "Only completed rides can be rated ([RATING_003]). "
        "Only confirmed ride participants can rate ([RATING_004]). "
        "Duplicate ratings for the same ride are forbidden ([RATING_005])."
    ),
    responses={
        201: {"description": "Rating submitted successfully"},
        400: {"model": ErrorResponse, "description": "[RATING_002] Self rating or [RATING_003] Ride not completed"},
        403: {"model": ErrorResponse, "description": "[RATING_004] Not a ride participant"},
        409: {"model": ErrorResponse, "description": "[RATING_005] Duplicate rating"},
    },
)
def submit_rating(
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RatingService(db)
    rating_resp = svc.create_rating(current_user, payload)

    return SuccessResponse(
        message="Rating submitted successfully.",
        data=rating_resp,
    )


@router.get(
    "/me",
    response_model=SuccessResponse[List[RatingResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Ratings & Reviews",
    description="Retrieves all ratings and reviews submitted by or received by the authenticated user.",
    responses={
        200: {"description": "My ratings retrieved successfully"},
    },
)
def list_my_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RatingService(db)
    ratings = svc.get_my_ratings(current_user)

    return SuccessResponse(
        message="My ratings retrieved successfully.",
        data=ratings,
    )


@router.patch(
    "/{id}",
    response_model=SuccessResponse[RatingResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Rating",
    description="Updates a submitted rating within 24 hours of submission. Immutable after 24 hours ([RATING_006]).",
    responses={
        200: {"description": "Rating updated successfully"},
        400: {"model": ErrorResponse, "description": "[RATING_006] Rating is immutable after 24 hours"},
        404: {"model": ErrorResponse, "description": "Rating not found"},
    },
)
def update_rating(
    id: UUID,
    payload: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = RatingService(db)
    rating_resp = svc.update_rating(current_user, id, payload)

    return SuccessResponse(
        message="Rating updated successfully.",
        data=rating_resp,
    )
