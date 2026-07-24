from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import ProfileSummaryResponse
from app.schemas.response import SuccessResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get(
    "/summary",
    response_model=SuccessResponse[ProfileSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User Profile Summary",
    description="Retrieves full user profile summary including member since date, average rating, completed rides/trips, and detailed commute statistics.",
    responses={
        200: {"description": "Profile summary retrieved successfully"},
    },
)
def get_profile_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DashboardService(db)
    summary = svc.get_profile_summary(current_user)

    return SuccessResponse(
        message="Profile summary retrieved successfully.",
        data=summary,
    )
