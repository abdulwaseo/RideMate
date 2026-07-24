import json
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from app.models.user import User
from app.models.notification import Notification, NotificationPreference, PushSubscription
from app.repositories.notification import (
    NotificationRepository,
    NotificationPreferenceRepository,
    PushSubscriptionRepository,
    NotificationDeliveryLogRepository,
)
from app.schemas.enums import NotificationCategory, NotificationPriority
from app.schemas.notification import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    UnreadNotificationCountResponse,
)
from app.services.push_notification_service import push_service


class NotificationService:
    """Business logic for user notifications, preferences, and push subscriptions."""

    def __init__(self, db: Session):
        self.db = db
        self.notif_repo = NotificationRepository(db)
        self.pref_repo = NotificationPreferenceRepository(db)
        self.push_repo = PushSubscriptionRepository(db)
        self.log_repo = NotificationDeliveryLogRepository(db)

    # ─── Notifications Listing & Operations ──────────────────────────────────

    def list_user_notifications(
        self,
        user: User,
        unread_only: bool = False,
        category: Optional[NotificationCategory] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[NotificationResponse]:
        notifs = self.notif_repo.list_by_user(user.id, unread_only, category, limit, offset)
        return [NotificationResponse.model_validate(n) for n in notifs]

    def get_unread_count(self, user: User) -> UnreadNotificationCountResponse:
        count = self.notif_repo.get_unread_count(user.id)
        recent = self.notif_repo.list_by_user(user.id, unread_only=True, limit=5)
        return UnreadNotificationCountResponse(
            unread_count=count,
            recent_unread=[NotificationResponse.model_validate(n) for n in recent],
        )

    def mark_read(self, user: User, notification_id: UUID) -> NotificationResponse:
        notif = self.notif_repo.get_by_id(notification_id)
        if not notif or notif.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

        updated = self.notif_repo.mark_as_read(notif)
        self.log_repo.log(notif.id, channel="IN_APP", status="READ")
        self.db.commit()
        return NotificationResponse.model_validate(updated)

    def mark_all_read(self, user: User) -> int:
        count = self.notif_repo.mark_all_as_read(user.id)
        self.db.commit()
        return count

    def delete_notification(self, user: User, notification_id: UUID) -> None:
        notif = self.notif_repo.get_by_id(notification_id)
        if not notif or notif.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

        self.notif_repo.soft_delete(notif)
        self.db.commit()

    # ─── Create Notification & Multi-Channel Dispatch ───────────────────────

    def create_and_dispatch(
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
        """
        Creates an in-app notification if allowed by user preferences,
        logs in-app delivery, dispatches Web Push if enabled, and emits WebSocket event.
        """
        # 1. Check preferences
        pref = self.pref_repo.get_or_create(user_id)
        if not self._is_category_enabled(pref, category):
            logger.info(f"Notification {title} skipped for user {user_id} due to category preference.")
            # Still create minimal suppressed record or return null
            notif = self.notif_repo.create(
                user_id=user_id,
                title=title,
                body=body,
                category=category,
                priority=priority,
                action_url=action_url,
                data_json=data_json,
            )
            self.db.commit()
            return notif

        # 2. Persist notification
        notif = self.notif_repo.create(
            user_id=user_id,
            title=title,
            body=body,
            category=category,
            priority=priority,
            action_url=action_url,
            data_json=data_json,
        )
        self.log_repo.log(notif.id, channel="IN_APP", status="DELIVERED")

        # 3. Web Push dispatch if enabled
        if pref.push_notifications:
            subs = self.push_repo.list_by_user(user_id)
            if subs:
                results = push_service.dispatch_web_push(notif, subs)
                for sub, success, reason in results:
                    self.log_repo.log(
                        notif.id,
                        channel="WEB_PUSH",
                        status="DELIVERED" if success else "FAILED",
                        failure_reason=reason,
                    )

        self.db.commit()

        # 4. Async WebSocket broadcast to user's personal room `user:<user_id>`
        self._broadcast_ws(user_id, notif)

        return notif

    def _is_category_enabled(self, pref: NotificationPreference, category: NotificationCategory) -> bool:
        if category == NotificationCategory.RIDE and not pref.ride_updates:
            return False
        if category == NotificationCategory.BOOKING and not pref.booking_updates:
            return False
        if category == NotificationCategory.CHAT and not pref.chat_messages:
            return False
        if category == NotificationCategory.SYSTEM and not pref.system_notifications:
            return False
        if category == NotificationCategory.PROMOTION and not pref.marketing_notifications:
            return False
        return True

    def _broadcast_ws(self, user_id: UUID, notif: Notification) -> None:
        """Broadcasts NOTIFICATION_CREATED event via WebSocket connection manager if available."""
        try:
            import asyncio
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import manager

            event = WSEvent(
                event_type=WSEventType.NOTIFICATION_CREATED.value,
                room_id=f"user:{user_id}",
                payload=NotificationResponse.model_validate(notif).model_dump(mode="json"),
            )
            # Schedule broadcast safely in running event loop
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.broadcast_to_room(f"user:{user_id}", event))
            except RuntimeError:
                pass  # No running event loop in synchronous context
        except Exception as e:
            logger.warning(f"Could not broadcast WS notification event: {e}")

    # ─── Preferences ──────────────────────────────────────────────────────────

    def get_preferences(self, user: User) -> NotificationPreferenceResponse:
        pref = self.pref_repo.get_or_create(user.id)
        self.db.commit()
        return NotificationPreferenceResponse.model_validate(pref)

    def update_preferences(
        self, user: User, payload: NotificationPreferenceUpdate
    ) -> NotificationPreferenceResponse:
        pref = self.pref_repo.get_or_create(user.id)
        updated = self.pref_repo.update(pref, **payload.model_dump(exclude_unset=True))
        self.db.commit()
        return NotificationPreferenceResponse.model_validate(updated)

    # ─── Push Subscriptions ───────────────────────────────────────────────────

    def register_push_subscription(
        self, user: User, payload: PushSubscriptionCreate
    ) -> PushSubscriptionResponse:
        sub = self.push_repo.create_or_update(
            user_id=user.id,
            subscription_data=payload.subscription_data,
            device_type=payload.device_type,
            browser=payload.browser,
            platform=payload.platform,
        )
        self.db.commit()
        return PushSubscriptionResponse.model_validate(sub)

    def remove_push_subscription(self, user: User, subscription_id: UUID) -> None:
        sub = self.push_repo.get_by_id(subscription_id)
        if not sub or sub.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Push subscription not found.")

        self.push_repo.deactivate(sub)
        self.db.commit()
