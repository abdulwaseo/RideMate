from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User, PassengerProfile
from app.models.token import RefreshToken


import re

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('0'):
        digits = '92' + digits[1:]
    return digits

class UserRepository:
    """All raw database operations for the User aggregate."""

    def __init__(self, db: Session):
        self.db = db

    # ---- User queries ----

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(
            User.id == user_id,
            User.is_deleted == False,
        ).first()

    def get_by_mobile(self, mobile_number: str) -> Optional[User]:
        # 1. Exact string match lookup
        user = self.db.query(User).filter(
            User.mobile_number == mobile_number,
            User.is_deleted == False,
        ).first()

        if user:
            return user

        # 2. Normalized digits fallback match (e.g. +92 321 9876543 vs 03219876543 vs +923219876543)
        target_digits = normalize_phone(mobile_number)
        if target_digits:
            users = self.db.query(User).filter(User.is_deleted == False).all()
            for u in users:
                if normalize_phone(u.mobile_number) == target_digits:
                    return u

        return None

    def create_user(
        self,
        *,
        name: str,
        mobile_number: str,
        hashed_password: str,
        office_name: Optional[str] = None,
        cnic_number: Optional[str] = None,
        date_of_birth: Optional[date] = None,
    ) -> User:
        user = User(
            name=name,
            mobile_number=mobile_number,
            hashed_password=hashed_password,
            office_name=office_name,
            cnic_number=cnic_number,
            date_of_birth=date_of_birth,
        )
        self.db.add(user)
        self.db.flush()  # get id before committing
        return user

    def mobile_exists(self, mobile_number: str) -> bool:
        return self.db.query(User.id).filter(
            User.mobile_number == mobile_number,
            User.is_deleted == False,
        ).first() is not None

    def cnic_exists(self, cnic_number: Optional[str]) -> bool:
        if not cnic_number:
            return False
        cleaned = cnic_number.strip().replace(" ", "")
        return self.db.query(User.id).filter(
            User.cnic_number == cleaned,
            User.is_deleted == False,
        ).first() is not None

    # ---- PassengerProfile ----

    def create_passenger_profile(self, user_id: UUID) -> PassengerProfile:
        profile = PassengerProfile(user_id=user_id)
        self.db.add(profile)
        self.db.flush()
        return profile

    # ---- RefreshToken ----

    def create_refresh_token(
        self, *, user_id: UUID, token: str, expires_at: datetime
    ) -> RefreshToken:
        rt = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
        self.db.add(rt)
        self.db.flush()
        return rt

    def get_refresh_token(self, token: str) -> Optional[RefreshToken]:
        return self.db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.is_revoked == False,
        ).first()

    def revoke_refresh_token(self, token: str) -> bool:
        rt = self.get_refresh_token(token)
        if not rt:
            return False
        rt.is_revoked = True
        self.db.flush()
        return True

    def revoke_all_user_tokens(self, user_id: UUID) -> None:
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,
        ).update({"is_revoked": True})
        self.db.flush()
