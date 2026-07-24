from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.audit import AuditRepository


class AuditService:
    """Service helper for auditing user actions and security events."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditRepository(db)

    def log(
        self,
        action: str,
        resource_type: str,
        user_id: Optional[UUID] = None,
        resource_id: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        self.repo.log_event(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.commit()
