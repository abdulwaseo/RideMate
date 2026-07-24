from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.enums import NotificationCategory
from app.schemas.notification import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    UnreadNotificationCountResponse,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.notification import NotificationService

router = APIRouter()


# ─── Notifications Core APIs ──────────────────────────────────────────────────

@router.get(
    "",
    response_model=SuccessResponse[List[NotificationResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Notifications",
    description="Retrieves in-app notifications for authenticated user with optional unread filter, category filter, limit, and offset.",
    responses={
        200: {"description": "Notifications retrieved successfully"},
    },
)
def list_notifications(
    unread_only: bool = Query(False, description="If true, returns only unread notifications"),
    category: Optional[NotificationCategory] = Query(None, description="Optional category filter"),
    limit: int = Query(50, ge=1, le=100, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Items offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    notifs = svc.list_user_notifications(current_user, unread_only, category, limit, offset)

    return SuccessResponse(
        message="Notifications retrieved successfully.",
        data=notifs,
    )


@router.get(
    "/unread",
    response_model=SuccessResponse[UnreadNotificationCountResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Unread Notification Count",
    description="Returns unread notification count and top 5 recent unread items.",
    responses={
        200: {"description": "Unread count retrieved"},
    },
)
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    count_resp = svc.get_unread_count(current_user)

    return SuccessResponse(
        message="Unread notification count retrieved.",
        data=count_resp,
    )


@router.patch(
    "/read-all",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Mark All Notifications as Read",
    description="Marks all unread notifications for the authenticated user as read.",
    responses={
        200: {"description": "All notifications marked as read"},
    },
)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    updated_count = svc.mark_all_read(current_user)

    return SuccessResponse(
        message=f"Marked {updated_count} notifications as read.",
        data={"updated_count": updated_count},
    )


@router.patch(
    "/{id}/read",
    response_model=SuccessResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Mark Single Notification as Read",
    description="Marks a specific in-app notification as read.",
    responses={
        200: {"description": "Notification marked as read"},
        404: {"model": ErrorResponse, "description": "Notification not found"},
    },
)
def mark_notification_read(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    notif_resp = svc.mark_read(current_user, id)

    return SuccessResponse(
        message="Notification marked as read.",
        data=notif_resp,
    )


@router.delete(
    "/{id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Notification",
    description="Soft-deletes a notification.",
    responses={
        200: {"description": "Notification deleted successfully"},
        404: {"model": ErrorResponse, "description": "Notification not found"},
    },
)
def delete_notification(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    svc.delete_notification(current_user, id)

    return SuccessResponse(message="Notification deleted successfully.", data=None)


# ─── Notification Preferences APIs ──────────────────────────────────────────

@router.get(
    "/preferences",
    response_model=SuccessResponse[NotificationPreferenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Notification Preferences",
    description="Returns notification preferences for authenticated user.",
    responses={
        200: {"description": "Preferences retrieved"},
    },
)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    prefs = svc.get_preferences(current_user)

    return SuccessResponse(
        message="Notification preferences retrieved.",
        data=prefs,
    )


@router.patch(
    "/preferences",
    response_model=SuccessResponse[NotificationPreferenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Notification Preferences",
    description="Updates user's notification preferences across categories and channels.",
    responses={
        200: {"description": "Preferences updated"},
    },
)
def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    updated = svc.update_preferences(current_user, payload)

    return SuccessResponse(
        message="Notification preferences updated successfully.",
        data=updated,
    )


# ─── Push Subscriptions APIs ─────────────────────────────────────────────────

@router.post(
    "/push-subscriptions",
    response_model=SuccessResponse[PushSubscriptionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register Push Subscription",
    description="Registers or updates Web Push API / FCM device subscription token for browser push notifications.",
    responses={
        201: {"description": "Push subscription registered"},
    },
)
def register_push_subscription(
    payload: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    sub = svc.register_push_subscription(current_user, payload)

    return SuccessResponse(
        message="Push notification subscription registered successfully.",
        data=sub,
    )


@router.delete(
    "/push-subscriptions/{id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Push Subscription",
    description="Deactivates a registered push subscription token.",
    responses={
        200: {"description": "Push subscription removed"},
        404: {"model": ErrorResponse, "description": "Push subscription not found"},
    },
)
def remove_push_subscription(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    svc.remove_push_subscription(current_user, id)

    return SuccessResponse(message="Push subscription deactivated.", data=None)
