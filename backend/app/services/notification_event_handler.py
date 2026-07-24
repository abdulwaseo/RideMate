from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.schemas.enums import NotificationCategory, NotificationPriority
from app.services.notification import NotificationService


class NotificationEventHandler:
    """
    Central event listener handling business domain events and creating
    targeted multi-channel notifications.
    """

    @staticmethod
    def on_ride_published(db: Session, driver_id: UUID, ride_id: UUID, route_title: str) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=driver_id,
            title="Ride Published Successfully 🚗",
            body=f"Your ride '{route_title}' is now live and accepting passenger booking requests.",
            category=NotificationCategory.RIDE,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/dashboard/driver/active-ride",
        )

    @staticmethod
    def on_ride_cancelled(db: Session, passenger_id: UUID, ride_title: str) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=passenger_id,
            title="Ride Cancelled ⚠️",
            body=f"The ride '{ride_title}' was cancelled by the driver. You can search for alternative commute routes.",
            category=NotificationCategory.RIDE,
            priority=NotificationPriority.HIGH,
            action_url="/dashboard/passenger/search",
        )

    @staticmethod
    def on_booking_requested(db: Session, driver_id: UUID, passenger_name: str, ride_id: UUID) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=driver_id,
            title="New Booking Request 🎟️",
            body=f"{passenger_name} requested a seat on your upcoming ride.",
            category=NotificationCategory.BOOKING,
            priority=NotificationPriority.HIGH,
            action_url="/dashboard/driver/requests",
        )

    @staticmethod
    def on_booking_accepted(db: Session, passenger_id: UUID, driver_name: str, ride_id: UUID) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=passenger_id,
            title="Booking Confirmed! 🎉",
            body=f"Driver {driver_name} accepted your ride request. You can now chat and track live location.",
            category=NotificationCategory.BOOKING,
            priority=NotificationPriority.HIGH,
            action_url=f"/dashboard/passenger/chat",
        )

    @staticmethod
    def on_booking_rejected(db: Session, passenger_id: UUID, ride_title: str) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=passenger_id,
            title="Booking Request Declined",
            body=f"Your booking request for '{ride_title}' was declined by the driver.",
            category=NotificationCategory.BOOKING,
            priority=NotificationPriority.MEDIUM,
            action_url="/dashboard/passenger/search",
        )

    @staticmethod
    def on_chat_message(db: Session, recipient_id: UUID, sender_name: str, snippet: str, room_id: str) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=recipient_id,
            title=f"New Message from {sender_name}",
            body=snippet[:100],
            category=NotificationCategory.CHAT,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/dashboard/chat/{room_id}",
        )

    @staticmethod
    def on_driver_verified(db: Session, driver_id: UUID) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=driver_id,
            title="Driver License Verified ✅",
            body="Your CNIC and driving credentials have been approved. You can now offer rides on RideMate.",
            category=NotificationCategory.DRIVER,
            priority=NotificationPriority.HIGH,
            action_url="/dashboard/driver",
        )

    @staticmethod
    def on_password_changed(db: Session, user_id: UUID) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=user_id,
            title="Security Alert: Password Changed 🔐",
            body="Your RideMate account password was updated. If you did not make this change, contact support immediately.",
            category=NotificationCategory.SECURITY,
            priority=NotificationPriority.CRITICAL,
            action_url="/dashboard/settings",
        )

    @staticmethod
    def on_system_announcement(db: Session, user_id: UUID, title: str, message: str) -> None:
        svc = NotificationService(db)
        svc.create_and_dispatch(
            user_id=user_id,
            title=title,
            body=message,
            category=NotificationCategory.SYSTEM,
            priority=NotificationPriority.NORMAL if hasattr(NotificationPriority, 'NORMAL') else NotificationPriority.MEDIUM,
            action_url="/dashboard",
        )
