import re
from datetime import date, datetime, timezone
from typing import Optional


def validate_pakistani_mobile(mobile: str) -> str:
    """
    Validates and formats Pakistani mobile numbers (+923XXXXXXXXX or 03XXXXXXXXX).
    Returns formatted +923XXXXXXXXX E.164 standard string.
    """
    cleaned = re.sub(r"[\s\-\(\)]", "", mobile)
    if cleaned.startswith("03"):
        cleaned = "+92" + cleaned[1:]
    elif cleaned.startswith("3") and len(cleaned) == 10:
        cleaned = "+92" + cleaned
    elif cleaned.startswith("923") and not cleaned.startswith("+"):
        cleaned = "+" + cleaned

    pattern = r"^\+923\d{9}$"
    if not re.match(pattern, cleaned):
        raise ValueError("[USER_004] Invalid Pakistani mobile number format. Expected format: +923001234567")
    return cleaned


def validate_cnic_number(cnic: str) -> str:
    """
    Validates Pakistani 13-digit CNIC format (e.g., 42101-1234567-1 or 4210112345671).
    Returns formatted 42101-1234567-1 string.
    """
    digits_only = re.sub(r"\D", "", cnic)
    if len(digits_only) != 13:
        raise ValueError("[DRIVER_002] CNIC number must be exactly 13 digits.")

    formatted = f"{digits_only[:5]}-{digits_only[5:12]}-{digits_only[12]}"
    return formatted


def validate_license_number(license_no: str) -> str:
    """Validates driving license number format."""
    cleaned = license_no.strip().upper()
    if len(cleaned) < 4 or len(cleaned) > 50:
        raise ValueError("[DRIVER_003] License number must be between 4 and 50 characters.")
    return cleaned


def validate_vehicle_registration(plate: str) -> str:
    """Validates vehicle registration plate number."""
    cleaned = plate.strip().upper()
    if len(cleaned) < 3 or len(cleaned) > 20:
        raise ValueError("[VEHICLE_002] Vehicle registration number must be between 3 and 20 characters.")
    return cleaned


def validate_strong_password(password: str) -> str:
    """
    Validates strong password policy:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        raise ValueError("[USER_004] Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("[USER_004] Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("[USER_004] Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("[USER_004] Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("[USER_004] Password must contain at least one special character.")
    return password


def validate_future_date(d: date) -> date:
    """Validates that departure date is not in the past."""
    today = datetime.now(timezone.utc).date()
    if d < today:
        raise ValueError("[RIDE_004] Departure date cannot be in the past.")
    return d
