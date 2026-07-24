from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.schemas.enums import NotificationCategory, NotificationPriority


class Notification(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    In-app user notification entity storing status alerts for rides, bookings, and system events.
    """

    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    body = Column(String(1000), nullable=False)
    category = Column(
        Enum(NotificationCategory),
        default=NotificationCategory.RIDE,
        nullable=False,
    )
    priority = Column(
        Enum(NotificationPriority),
        default=NotificationPriority.MEDIUM,
        nullable=False,
    )
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    action_url = Column(String(500), nullable=True)
    data_json = Column(String(2000), nullable=True)

    user = relationship("User")


class NotificationPreference(Base, UUIDMixin, TimestampMixin):
    """
    User settings controlling enabled notification categories and channels.
    """

    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    ride_updates = Column(Boolean, default=True, nullable=False)
    booking_updates = Column(Boolean, default=True, nullable=False)
    chat_messages = Column(Boolean, default=True, nullable=False)
    system_notifications = Column(Boolean, default=True, nullable=False)
    marketing_notifications = Column(Boolean, default=False, nullable=False)
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)

    user = relationship("User")


class PushSubscription(Base, UUIDMixin, TimestampMixin):
    """
    Device or browser push notification subscription token (Web Push VAPID or FCM).
    """

    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_type = Column(String(50), default="web", nullable=False)
    browser = Column(String(50), nullable=True)
    platform = Column(String(50), nullable=True)
    subscription_data = Column(String(2000), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_seen = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")


class NotificationDeliveryLog(Base, UUIDMixin, TimestampMixin):
    """
    Audit log tracking notification delivery status per channel (In-App, Web Push, FCM, Email).
    """

    notification_id = Column(
        ForeignKey("notification.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    channel = Column(String(50), nullable=False)  # IN_APP, WEB_PUSH, FCM, EMAIL
    status = Column(String(50), default="DELIVERED", nullable=False)  # PENDING, DELIVERED, FAILED, READ
    sent_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(String(500), nullable=True)

    notification = relationship("Notification")
