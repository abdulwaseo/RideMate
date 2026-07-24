from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.response import SuccessResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=SuccessResponse,
    summary="Application Health Check",
    description="Returns overall application health, environment details, and database connectivity status.",
)
def check_health(db: Session = Depends(get_db)):
    """Retrieve application status and database connectivity status."""
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        db_healthy = False

    payload = {
        "status": "healthy" if db_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0-rc1",
        "database": "connected" if db_healthy else "disconnected",
    }

    return SuccessResponse(
        success=db_healthy,
        message="Application health is stable",
        data=payload,
    )


@router.get(
    "/health/liveness",
    status_code=status.HTTP_200_OK,
    summary="Kubernetes Liveness Probe",
    description="Lightweight liveness check for container orchestrators (Kubernetes / Docker).",
)
def liveness_probe():
    return {"status": "alive"}


@router.get(
    "/health/readiness",
    status_code=status.HTTP_200_OK,
    summary="Kubernetes Readiness Probe",
    description="Readiness check verifying database connectivity before routing traffic.",
)
def readiness_probe(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "healthy"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity failed.",
        )
