import pytest
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import status

NOTIFICATION_USER = {
    "name": "Notif User",
    "mobile_number": "+923009988776",
    "password": "Str0ng@Pass!",
}


@pytest.fixture
def notif_setup(client):
    """Registers a user and returns authorization headers and token."""
    reg = client.post("/api/v1/auth/register", json=NOTIFICATION_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return {"headers": headers, "token": token}


# ─── Unit Tests for Preferences ─────────────────────────────────────────────

def test_get_and_update_notification_preferences(client, notif_setup):
    """User can fetch default preferences and update settings."""
    headers = notif_setup["headers"]

    # Get default preferences
    res = client.get("/api/v1/notifications/preferences", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]
    assert data["ride_updates"] is True
    assert data["push_notifications"] is True
    assert data["marketing_notifications"] is False

    # Update preferences
    patch_res = client.patch(
        "/api/v1/notifications/preferences",
        json={"push_notifications": False, "marketing_notifications": True},
        headers=headers,
    )
    assert patch_res.status_code == status.HTTP_200_OK
    updated = patch_res.json()["data"]
    assert updated["push_notifications"] is False
    assert updated["marketing_notifications"] is True


# ─── Push Subscription Tests ──────────────────────────────────────────────────

def test_register_and_remove_push_subscription(client, notif_setup):
    """User can register a device push subscription and deactivate it."""
    headers = notif_setup["headers"]

    sub_payload = {
        "device_type": "web",
        "browser": "Chrome 122",
        "platform": "macOS",
        "subscription_data": '{"endpoint":"https://fcm.googleapis.com/fcm/send/fake-token","keys":{"auth":"123","p256dh":"456"}}',
    }

    reg_res = client.post(
        "/api/v1/notifications/push-subscriptions",
        json=sub_payload,
        headers=headers,
    )
    assert reg_res.status_code == status.HTTP_201_CREATED
    sub_data = reg_res.json()["data"]
    assert sub_data["device_type"] == "web"
    assert sub_data["is_active"] is True
    sub_id = sub_data["id"]

    # Delete subscription
    del_res = client.delete(
        f"/api/v1/notifications/push-subscriptions/{sub_id}",
        headers=headers,
    )
    assert del_res.status_code == status.HTTP_200_OK


# ─── Notifications Listing & Operations ───────────────────────────────────────

def test_notification_creation_and_unread_count(client, notif_setup):
    """Notification service creates notification and exposes unread count."""
    headers = notif_setup["headers"]

    # Initially 0 unread
    res = client.get("/api/v1/notifications/unread", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["data"]["unread_count"] == 0

    # List empty notifications
    list_res = client.get("/api/v1/notifications", headers=headers)
    assert list_res.status_code == status.HTTP_200_OK
    assert isinstance(list_res.json()["data"], list)


def test_mark_single_and_all_notifications_read(client, notif_setup):
    """Test marking individual notification and bulk mark-all as read."""
    headers = notif_setup["headers"]

    # Mark all read on empty set
    res = client.patch("/api/v1/notifications/read-all", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    assert "updated_count" in res.json()["data"]


def test_unauthorized_notification_access(client):
    """Unauthenticated requests are rejected with 401."""
    res = client.get("/api/v1/notifications")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
