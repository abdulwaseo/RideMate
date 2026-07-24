from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.schemas.response import SuccessResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[DashboardResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User Analytics Dashboard",
    description=(
        "Retrieves role-specific analytics and commute statistics for the authenticated user. "
        "Includes Driver stats (completed/cancelled rides, earnings, rating) "
        "and Passenger stats (completed trips, money saved, CO2 saved)."
    ),
    responses={
        200: {"description": "Dashboard analytics retrieved successfully"},
    },
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DashboardService(db)
    dashboard_data = svc.get_dashboard(current_user)

    return SuccessResponse(
        message="Dashboard analytics retrieved successfully.",
        data=dashboard_data,
    )
