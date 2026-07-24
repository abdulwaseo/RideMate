from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import NotificationCategory, NotificationPriority


class NotificationResponse(BaseModel):
    """Output representation of an in-app Notification."""

    id: UUID
    user_id: UUID
    title: str
    body: str
    category: NotificationCategory
    priority: NotificationPriority
    is_read: bool
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    data_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadNotificationCountResponse(BaseModel):
    """Count of unread notifications for a user."""

    unread_count: int
    recent_unread: List[NotificationResponse] = Field(default_factory=list)


class NotificationPreferenceResponse(BaseModel):
    """User notification channel and category preferences."""

    id: UUID
    user_id: UUID
    ride_updates: bool
    booking_updates: bool
    chat_messages: bool
    system_notifications: bool
    marketing_notifications: bool
    email_notifications: bool
    push_notifications: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationPreferenceUpdate(BaseModel):
    """Updatable notification preferences."""

    ride_updates: Optional[bool] = None
    booking_updates: Optional[bool] = None
    chat_messages: Optional[bool] = None
    system_notifications: Optional[bool] = None
    marketing_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None


class PushSubscriptionCreate(BaseModel):
    """Payload to register or update a device/browser push subscription."""

    device_type: str = "web"
    browser: Optional[str] = None
    platform: Optional[str] = None
    subscription_data: str  # Endpoint + keys JSON string or FCM token


class PushSubscriptionResponse(BaseModel):
    """Output representation of a push subscription."""

    id: UUID
    user_id: UUID
    device_type: str
    browser: Optional[str] = None
    platform: Optional[str] = None
    is_active: bool
    last_seen: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
