from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.notification import (
    Notification,
    NotificationPreference,
    PushSubscription,
    NotificationDeliveryLog,
)
from app.schemas.enums import NotificationCategory, NotificationPriority


class NotificationRepository:
    """Database operations for Notification entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, notification_id: UUID) -> Optional[Notification]:
        return self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.is_deleted == False,
        ).first()

    def list_by_user(
        self,
        user_id: UUID,
        unread_only: bool = False,
        category: Optional[NotificationCategory] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Notification]:
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_deleted == False,
        )
        if unread_only:
            query = query.filter(Notification.is_read == False)
        if category:
            query = query.filter(Notification.category == category)

        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    def get_unread_count(self, user_id: UUID) -> int:
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
            Notification.is_deleted == False,
        ).count()

    def create(
        self,
        *,
        user_id: UUID,
        title: str,
        body: str,
        category: NotificationCategory = NotificationCategory.RIDE,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        data_json: Optional[str] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            category=category,
            priority=priority,
            action_url=action_url,
            data_json=data_json,
            is_read=False,
        )
        self.db.add(notif)
        self.db.flush()
        return notif

    def mark_as_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.db.flush()
        return notification

    def mark_all_as_read(self, user_id: UUID) -> int:
        now = datetime.now(timezone.utc)
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
            Notification.is_deleted == False,
        ).update(
            {Notification.is_read: True, Notification.read_at: now},
            synchronize_session=False,
        )
        self.db.flush()
        return count

    def soft_delete(self, notification: Notification) -> None:
        notification.is_deleted = True
        notification.deleted_at = datetime.now(timezone.utc)
        self.db.flush()


class NotificationPreferenceRepository:
    """Database operations for NotificationPreference entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: UUID) -> Optional[NotificationPreference]:
        return self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()

    def get_or_create(self, user_id: UUID) -> NotificationPreference:
        pref = self.get_by_user(user_id)
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                ride_updates=True,
                booking_updates=True,
                chat_messages=True,
                system_notifications=True,
                marketing_notifications=False,
                email_notifications=True,
                push_notifications=True,
            )
            self.db.add(pref)
            self.db.flush()
        return pref

    def update(
        self, pref: NotificationPreference, **kwargs
    ) -> NotificationPreference:
        for key, value in kwargs.items():
            if value is not None and hasattr(pref, key):
                setattr(pref, key, value)
        self.db.flush()
        return pref


class PushSubscriptionRepository:
    """Database operations for PushSubscription entity."""

    def __init__(self, db: Session):
        self.db = db

    def list_by_user(self, user_id: UUID) -> List[PushSubscription]:
        return self.db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active == True,
        ).all()

    def get_by_id(self, subscription_id: UUID) -> Optional[PushSubscription]:
        return self.db.query(PushSubscription).filter(
            PushSubscription.id == subscription_id
        ).first()

    def create_or_update(
        self,
        user_id: UUID,
        subscription_data: str,
        device_type: str = "web",
        browser: Optional[str] = None,
        platform: Optional[str] = None,
    ) -> PushSubscription:
        existing = self.db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id,
            PushSubscription.subscription_data == subscription_data,
        ).first()

        now = datetime.now(timezone.utc)
        if existing:
            existing.is_active = True
            existing.last_seen = now
            existing.device_type = device_type
            if browser:
                existing.browser = browser
            if platform:
                existing.platform = platform
            self.db.flush()
            return existing

        sub = PushSubscription(
            user_id=user_id,
            subscription_data=subscription_data,
            device_type=device_type,
            browser=browser,
            platform=platform,
            is_active=True,
            last_seen=now,
        )
        self.db.add(sub)
        self.db.flush()
        return sub

    def deactivate(self, sub: PushSubscription) -> None:
        sub.is_active = False
        self.db.flush()


class NotificationDeliveryLogRepository:
    """Database operations for NotificationDeliveryLog entity."""

    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        notification_id: UUID,
        channel: str,
        status: str = "DELIVERED",
        failure_reason: Optional[str] = None,
    ) -> NotificationDeliveryLog:
        now = datetime.now(timezone.utc)
        entry = NotificationDeliveryLog(
            notification_id=notification_id,
            channel=channel,
            status=status,
            sent_at=now,
            delivered_at=now if status == "DELIVERED" else None,
            failure_reason=failure_reason,
        )
        self.db.add(entry)
        self.db.flush()
        return entry
