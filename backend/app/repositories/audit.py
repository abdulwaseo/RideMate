from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.audit import AuditLog


class AuditRepository:
    """Database operations for AuditLog entity."""

    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        *,
        user_id: Optional[UUID] = None,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)
        self.db.flush()
        return audit

    def list_by_user(self, user_id: UUID, limit: int = 50) -> List[AuditLog]:
        return self.db.query(AuditLog).filter(
            AuditLog.user_id == user_id,
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
