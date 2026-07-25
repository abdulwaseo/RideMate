from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.chat import MessageRepository
from app.repositories.notification import NotificationRepository
from app.schemas.enums import MessageType, NotificationCategory, NotificationPriority


class EventDispatcher(ABC):
    """
    Abstract interface for broadcasting notifications and system event messages.
    Allows seamlessly swapping or extending in-app DB persistence with
    WebSockets, Server-Sent Events (SSE), or Firebase Push Notifications (FCM).
    """

    @abstractmethod
    def dispatch_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        category: NotificationCategory = NotificationCategory.RIDE,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        data_json: Optional[str] = None,
    ) -> None:
        pass

    @abstractmethod
    def broadcast_system_message(
        self,
        chat_room_id: UUID,
        content: str,
    ) -> None:
        pass


class InAppEventDispatcher(EventDispatcher):
    """Production in-app database implementation of EventDispatcher."""

    def __init__(self, db: Session):
        self.db = db
        self.notif_repo = NotificationRepository(db)
        self.msg_repo = MessageRepository(db)

    def dispatch_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        category: NotificationCategory = NotificationCategory.RIDE,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        data_json: Optional[str] = None,
    ) -> None:
        self.notif_repo.create(
            user_id=user_id,
            title=title,
            body=body,
            category=category,
            priority=priority,
            action_url=action_url,
            data_json=data_json,
        )

    def broadcast_system_message(
        self,
        chat_room_id: UUID,
        content: str,
    ) -> None:
        self.msg_repo.create_message(
            chat_room_id=chat_room_id,
            sender_id=None,
            message_type=MessageType.SYSTEM,
            content=content,
        )
