from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.enums import UserRole

# Scheme: extracts Bearer token from Authorization header
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that resolves the authenticated user from the Bearer token.
    Raises HTTP 401 if token is missing, invalid, or user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)

    if not user:
        raise credentials_exception

    # Verify role claim in token if present
    token_role = payload.get("role")
    if token_role and token_role.lower() != user.role.value.lower():
        raise credentials_exception

    return user


def get_current_driver(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that asserts the current user has Driver role & DriverProfile.
    Raises HTTP 403 if not a driver.
    """
    if current_user.role != UserRole.DRIVER or not current_user.driver_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver role and profile required to access this resource.",
        )
    return current_user


def get_current_passenger(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that asserts the current user has Passenger role & PassengerProfile.
    Raises HTTP 403 if not a passenger.
    """
    if current_user.role != UserRole.PASSENGER or not current_user.passenger_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Passenger role and profile required to access this resource.",
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Placeholder admin guard for future admin panel endpoints."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return current_user
