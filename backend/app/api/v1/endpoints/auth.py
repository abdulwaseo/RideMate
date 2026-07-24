from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.auth import AuthService

router = APIRouter()


# ------------------------------------------------------------------ #
#  POST /register                                                      #
# ------------------------------------------------------------------ #

@router.post(
    "/register",
    response_model=SuccessResponse[AuthResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description=(
        "Creates a new commuter account with a `PassengerProfile` by default. "
        "Accepts a valid Pakistani mobile number as the unique login identifier. "
        "Password must be ≥8 characters and contain at least one uppercase letter, "
        "one digit, and one special character."
    ),
    responses={
        201: {"description": "Account created successfully"},
        409: {"model": ErrorResponse, "description": "Mobile number already registered"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    user, access_token, refresh_token = svc.register(payload)

    return SuccessResponse(
        message="Account registered successfully.",
        data=AuthResponse(
            tokens=TokenPair(access_token=access_token, refresh_token=refresh_token),
            user=UserOut.model_validate(user),
        ),
    )


# ------------------------------------------------------------------ #
#  POST /login                                                         #
# ------------------------------------------------------------------ #

@router.post(
    "/login",
    response_model=SuccessResponse[AuthResponse],
    status_code=status.HTTP_200_OK,
    summary="Login with mobile number and password",
    description=(
        "Authenticates using a registered Pakistani mobile number and password. "
        "Returns an access token (short-lived) and a refresh token (long-lived). "
        "Include the access token as `Authorization: Bearer <token>` on subsequent requests."
    ),
    responses={
        200: {"description": "Login successful"},
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    user, access_token, refresh_token = svc.login(payload)

    return SuccessResponse(
        message="Login successful.",
        data=AuthResponse(
            tokens=TokenPair(access_token=access_token, refresh_token=refresh_token),
            user=UserOut.model_validate(user),
        ),
    )


# ------------------------------------------------------------------ #
#  POST /refresh                                                       #
# ------------------------------------------------------------------ #

@router.post(
    "/refresh",
    response_model=SuccessResponse[AuthResponse],
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token and issue new access token",
    description=(
        "Validates the provided refresh token and issues a **new token pair** "
        "(token rotation). The old refresh token is immediately revoked. "
        "Clients should store the new refresh token for subsequent calls."
    ),
    responses={
        200: {"description": "Tokens refreshed successfully"},
        401: {"model": ErrorResponse, "description": "Invalid, expired, or revoked refresh token"},
    },
)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    user, access_token, refresh_token = svc.refresh(payload.refresh_token)

    return SuccessResponse(
        message="Token refreshed successfully.",
        data=AuthResponse(
            tokens=TokenPair(access_token=access_token, refresh_token=refresh_token),
            user=UserOut.model_validate(user),
        ),
    )


# ------------------------------------------------------------------ #
#  POST /logout                                                        #
# ------------------------------------------------------------------ #

@router.post(
    "/logout",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout and revoke refresh token",
    description=(
        "Revokes the provided refresh token, preventing future token rotation "
        "with that token. This endpoint is **idempotent** — calling it with an "
        "already-revoked token succeeds silently."
    ),
    responses={
        200: {"description": "Logged out successfully"},
    },
)
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
):
    svc = AuthService(db)
    svc.logout(payload.refresh_token)

    return SuccessResponse(message="Logged out successfully.", data=None)


# ------------------------------------------------------------------ #
#  GET /me                                                             #
# ------------------------------------------------------------------ #

@router.get(
    "/me",
    response_model=SuccessResponse[UserOut],
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description=(
        "Returns the profile of the currently authenticated user. "
        "Requires a valid `Authorization: Bearer <access_token>` header. "
        "Includes role, passenger/driver profile references, and account metadata."
    ),
    responses={
        200: {"description": "User profile returned"},
        401: {"model": ErrorResponse, "description": "Invalid or missing access token"},
    },
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        message="User profile retrieved.",
        data=UserOut.model_validate(current_user),
    )
