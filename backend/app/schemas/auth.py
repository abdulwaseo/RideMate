import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.schemas.enums import UserRole, VerificationStatus


# ---------- Validators ----------

PAKISTAN_MOBILE_RE = re.compile(
    r"^(?:\+92|92|0)3[0-9]{9}$"
)


def validate_pakistani_mobile(v: str) -> str:
    """Validate Pakistani mobile number format: +923001234567 / 03001234567."""
    cleaned = v.strip().replace("-", "").replace(" ", "")
    if not PAKISTAN_MOBILE_RE.match(cleaned):
        raise ValueError(
            "Mobile number must be a valid Pakistani number "
            "(e.g. +923001234567, 923001234567, or 03001234567)."
        )
    return cleaned


# ---------- Request Schemas ----------

class RegisterRequest(BaseModel):
    """Payload accepted for new user registration."""

    name: str = Field(
        ...,
        min_length=3,
        max_length=50,
        examples=["Abdul Waseo"],
        description="Full legal name of the commuter.",
    )
    mobile_number: str = Field(
        ...,
        examples=["+923001234567"],
        description="Pakistani mobile number used as login identifier.",
    )
    password: str = Field(
        ...,
        min_length=8,
        examples=["Str0ngP@ss!"],
        description="Minimum 8 characters. Must include uppercase, digit and special char.",
    )
    office_name: Optional[str] = Field(
        None,
        max_length=100,
        examples=["Dilkusha Towers"],
        description="Optional office / company name.",
    )

    @field_validator("mobile_number")
    @classmethod
    def check_mobile(cls, v: str) -> str:
        return validate_pakistani_mobile(v)

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character.")
        return v


class LoginRequest(BaseModel):
    """Credentials accepted for login."""

    mobile_number: str = Field(
        ...,
        examples=["+923001234567"],
        description="Registered Pakistani mobile number.",
    )
    password: str = Field(
        ...,
        examples=["Str0ngP@ss!"],
        description="Account password.",
    )

    @field_validator("mobile_number")
    @classmethod
    def check_mobile(cls, v: str) -> str:
        return validate_pakistani_mobile(v)


class RefreshRequest(BaseModel):
    """Payload carrying the refresh token for rotation."""

    refresh_token: str = Field(..., description="Valid refresh JWT token.")


class LogoutRequest(BaseModel):
    """Payload to invalidate a refresh token."""

    refresh_token: str = Field(..., description="Refresh JWT token to invalidate.")


# ---------- Response Schemas ----------

class PassengerProfileOut(BaseModel):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DriverProfileOut(BaseModel):
    id: UUID
    cnic_number: str
    license_number: str
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    """Safe user representation — never exposes hashed_password."""

    id: UUID
    name: str
    mobile_number: str
    role: UserRole
    verification_status: VerificationStatus
    office_name: Optional[str] = None
    passenger_profile: Optional[PassengerProfileOut] = None
    driver_profile: Optional[DriverProfileOut] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenPair(BaseModel):
    """Returned on login / register / refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Combined token + user payload."""

    tokens: TokenPair
    user: UserOut
