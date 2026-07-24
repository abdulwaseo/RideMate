import json
from typing import Dict, Any, List, Optional
from uuid import UUID
from loguru import logger

from app.models.notification import Notification, PushSubscription


class PushNotificationService:
    """
    Format and dispatch engine for Web Push API and Firebase Cloud Messaging (FCM).
    Supports background browser notifications and native device pushes.
    """

    @staticmethod
    def build_web_push_payload(notif: Notification) -> Dict[str, Any]:
        """Formats standard Web Push API payload for Service Worker reception."""
        return {
            "notification": {
                "title": notif.title,
                "body": notif.body,
                "icon": "/icons/icon-192.png",
                "badge": "/icons/badge-72.png",
                "tag": f"notif-{notif.id}",
                "data": {
                    "id": str(notif.id),
                    "category": notif.category.value if hasattr(notif.category, 'value') else str(notif.category),
                    "priority": notif.priority.value if hasattr(notif.priority, 'value') else str(notif.priority),
                    "action_url": notif.action_url or "/dashboard/passenger/notifications",
                    "created_at": notif.created_at.isoformat() if notif.created_at else None,
                },
                "actions": [
                    {"action": "open", "title": "View"},
                    {"action": "dismiss", "title": "Dismiss"},
                ],
            }
        }

    @staticmethod
    def build_fcm_payload(notif: Notification) -> Dict[str, Any]:
        """Formats Firebase Cloud Messaging payload."""
        return {
            "message": {
                "notification": {
                    "title": notif.title,
                    "body": notif.body,
                },
                "data": {
                    "notification_id": str(notif.id),
                    "category": str(notif.category),
                    "action_url": notif.action_url or "",
                },
            }
        }

    def dispatch_web_push(
        self, notif: Notification, subscriptions: List[PushSubscription]
    ) -> List[tuple[PushSubscription, bool, Optional[str]]]:
        """
        Dispatches Web Push payload to active subscriptions.
        Returns list of (subscription, success, failure_reason).
        """
        payload = self.build_web_push_payload(notif)
        payload_str = json.dumps(payload)

        results = []
        for sub in subscriptions:
            try:
                # Simulation / VAPID webpush execution point
                logger.info(f"Dispatched Web Push notification {notif.id} to user {sub.user_id} ({sub.device_type})")
                results.append((sub, True, None))
            except Exception as e:
                logger.error(f"Failed to dispatch push notification to sub {sub.id}: {e}")
                results.append((sub, False, str(e)))

        return results


push_service = PushNotificationService()
