from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.rating import UserRatingSummary
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.rating import RatingService

router = APIRouter()


@router.get(
    "/{id}/ratings",
    response_model=SuccessResponse[UserRatingSummary],
    status_code=status.HTTP_200_OK,
    summary="Get User Public Ratings & Reviews",
    description="Retrieves public reputation summary, average rating score, total review count, and recent reviews for a user.",
    responses={
        200: {"description": "User rating summary retrieved successfully"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
def get_user_ratings(
    id: UUID,
    db: Session = Depends(get_db),
):
    svc = RatingService(db)
    summary = svc.get_public_user_ratings(id)

    return SuccessResponse(
        message="User public rating summary retrieved.",
        data=summary,
    )
