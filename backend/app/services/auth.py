from datetime import datetime, timedelta, timezone
from typing import Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthService:
    """Business logic for authentication flows."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    # ------------------------------------------------------------------ #
    #  Register                                                            #
    # ------------------------------------------------------------------ #

    def register(self, payload: RegisterRequest) -> Tuple[User, str, str]:
        """
        Create a new user account with PassengerProfile.

        Returns (user, access_token, refresh_token).
        Raises 409 if mobile number already registered.
        """
        if self.repo.mobile_exists(payload.mobile_number):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Mobile number is already registered.",
            )

        hashed_pw = get_password_hash(payload.password)

        user = self.repo.create_user(
            name=payload.name,
            mobile_number=payload.mobile_number,
            hashed_password=hashed_pw,
            office_name=payload.office_name,
            cnic_number=payload.cnic_number,
            date_of_birth=payload.date_of_birth,
        )

        # Every new account gets a PassengerProfile by default
        self.repo.create_passenger_profile(user_id=user.id)

        access_token, refresh_token = self._issue_tokens(user)

        self.db.commit()
        self.db.refresh(user)
        return user, access_token, refresh_token

    # ------------------------------------------------------------------ #
    #  Login                                                               #
    # ------------------------------------------------------------------ #

    def login(self, payload: LoginRequest) -> Tuple[User, str, str]:
        """
        Authenticate via mobile + password.

        Returns (user, access_token, refresh_token).
        Raises 401 on bad credentials.
        """
        user = self.repo.get_by_mobile(payload.mobile_number)

        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mobile number or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token, refresh_token = self._issue_tokens(user)
        self.db.commit()
        self.db.refresh(user)
        return user, access_token, refresh_token

    # ------------------------------------------------------------------ #
    #  Refresh                                                             #
    # ------------------------------------------------------------------ #

    def refresh(self, refresh_token_str: str) -> Tuple[User, str, str]:
        """
        Validate a refresh token and issue a new token pair (rotation).

        Raises 401 if token is invalid, expired, or revoked.
        """
        payload = decode_token(refresh_token_str)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        rt = self.repo.get_refresh_token(refresh_token_str)
        if not rt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check expiry explicitly
        expires_at = rt.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = self.repo.get_by_id(rt.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found.",
            )

        # Revoke old token (rotation)
        self.repo.revoke_refresh_token(refresh_token_str)

        # Issue fresh pair
        new_access, new_refresh = self._issue_tokens(user)
        self.db.commit()
        self.db.refresh(user)
        return user, new_access, new_refresh

    # ------------------------------------------------------------------ #
    #  Logout                                                              #
    # ------------------------------------------------------------------ #

    def logout(self, refresh_token_str: str) -> None:
        """Revoke a specific refresh token."""
        revoked = self.repo.revoke_refresh_token(refresh_token_str)
        self.db.commit()
        # Silently succeed even if token was not found (idempotent)

    # ------------------------------------------------------------------ #
    #  Internal helpers                                                    #
    # ------------------------------------------------------------------ #

    def _issue_tokens(self, user: User) -> Tuple[str, str]:
        """Generate and persist an access + refresh token pair."""
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        self.repo.create_refresh_token(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        return access_token, refresh_token
