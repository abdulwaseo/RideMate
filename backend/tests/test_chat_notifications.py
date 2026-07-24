"""
Integration tests for Chat & Notification Module (Sprint 8F).
"""
import pytest
from datetime import date, timedelta
from app.schemas.enums import MessageType, VehicleType

DRIVER_USER = {
    "name": "Chat Driver",
    "mobile_number": "+923009991111",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "Chat Passenger",
    "mobile_number": "+923009992222",
    "password": "Str0ng@Pass!",
}

UNINVOLVED_USER = {
    "name": "Outside User",
    "mobile_number": "+923009993333",
    "password": "Str0ng@Pass!",
}

FUTURE_DATE = (date.today() + timedelta(days=3)).isoformat()


@pytest.fixture
def chat_setup(client):
    """Register driver, passenger, publish ride, request seat, and accept booking."""
    # 1. Driver setup
    driver_reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    driver_token = driver_reg.json()["data"]["tokens"]["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-9999999-9", "license_number": "DL-999"}, headers=driver_headers)
    client.post("/api/v1/vehicles", json={
        "vehicle_type": VehicleType.CAR.value,
        "manufacturer": "Toyota",
        "model": "Yaris",
        "registration_number": "CHAT-999",
        "color": "White",
        "seat_capacity": 4,
        "is_active": True,
    }, headers=driver_headers)

    pub_resp = client.post("/api/v1/rides", json={
        "pickup_area": "PECHS",
        "pickup_point": "Tariq Road Chowrangi",
        "destination_area": "Clifton",
        "destination_point": "Ocean Mall",
        "departure_date": FUTURE_DATE,
        "departure_time": "17:30:00",
        "available_seats": 3,
        "fare_per_passenger": 200.0,
    }, headers=driver_headers)
    ride_id = pub_resp.json()["data"]["id"]

    # 2. Passenger setup
    pass_reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    pass_token = pass_reg.json()["data"]["tokens"]["access_token"]
    passenger_headers = {"Authorization": f"Bearer {pass_token}"}

    # 3. Uninvolved user setup
    outsider_reg = client.post("/api/v1/auth/register", json=UNINVOLVED_USER)
    outsider_token = outsider_reg.json()["data"]["tokens"]["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 4. Request & Accept -> Auto creates ChatRoom & Notifications
    req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger_headers)
    req_id = req_resp.json()["data"]["id"]

    acc_resp = client.post if False else client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=driver_headers)

    return driver_headers, passenger_headers, outsider_headers, ride_id


# ------------------------------------------------------------------ #
#  Chat Tests                                                         #
# ------------------------------------------------------------------ #

class TestChatModule:

    def test_automatic_chatroom_creation_and_system_message(self, client, chat_setup):
        driver_headers, passenger_headers, _, _ = chat_setup

        # List rooms for driver
        rooms_resp = client.get("/api/v1/chat", headers=driver_headers)
        assert rooms_resp.status_code == 200
        rooms = rooms_resp.json()["data"]
        assert len(rooms) >= 1
        room_id = rooms[0]["id"]

        # Check messages (should have automated system message: "Passenger Chat Passenger joined the ride.")
        msg_resp = client.get(f"/api/v1/chat/{room_id}/messages", headers=driver_headers)
        assert msg_resp.status_code == 200
        messages = msg_resp.json()["data"]
        assert len(messages) >= 1
        assert messages[0]["message_type"] == MessageType.SYSTEM.value
        assert "joined the ride" in messages[0]["content"]

    def test_post_chat_message_success(self, client, chat_setup):
        driver_headers, passenger_headers, _, _ = chat_setup
        room_id = client.get("/api/v1/chat", headers=driver_headers).json()["data"][0]["id"]

        # Passenger posts message
        post_resp = client.post(f"/api/v1/chat/{room_id}/messages", json={"content": "I am waiting at Tariq Road."}, headers=passenger_headers)
        assert post_resp.status_code == 201
        assert post_resp.json()["data"]["content"] == "I am waiting at Tariq Road."
        assert post_resp.json()["data"]["sender_name"] == "Chat Passenger"

    def test_unauthorized_user_cannot_access_chat(self, client, chat_setup):
        driver_headers, _, outsider_headers, _ = chat_setup
        room_id = client.get("/api/v1/chat", headers=driver_headers).json()["data"][0]["id"]

        # Outsider attempting to view or post messages
        get_resp = client.get(f"/api/v1/chat/{room_id}/messages", headers=outsider_headers)
        assert get_resp.status_code == 403

        post_resp = client.post(f"/api/v1/chat/{room_id}/messages", json={"content": "Hacker msg"}, headers=outsider_headers)
        assert post_resp.status_code == 403


# ------------------------------------------------------------------ #
#  Notification Tests                                                #
# ------------------------------------------------------------------ #

class TestNotificationModule:

    def test_passenger_receives_acceptance_notification(self, client, chat_setup):
        _, passenger_headers, _, _ = chat_setup

        notif_resp = client.get("/api/v1/notifications", headers=passenger_headers)
        assert notif_resp.status_code == 200
        notifs = notif_resp.json()["data"]
        assert len(notifs) >= 1
        assert "Accepted" in notifs[0]["title"]
        assert notifs[0]["is_read"] is False

    def test_mark_notification_as_read(self, client, chat_setup):
        _, passenger_headers, _, _ = chat_setup
        notifs = client.get("/api/v1/notifications", headers=passenger_headers).json()["data"]
        notif_id = notifs[0]["id"]

        read_resp = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=passenger_headers)
        assert read_resp.status_code == 200
        assert read_resp.json()["data"]["is_read"] is True

    def test_mark_all_notifications_as_read(self, client, chat_setup):
        _, passenger_headers, _, _ = chat_setup
        read_all_resp = client.patch("/api/v1/notifications/read-all", headers=passenger_headers)
        assert read_all_resp.status_code == 200
        assert read_all_resp.json()["data"]["updated_count"] >= 1

    def test_delete_notification(self, client, chat_setup):
        _, passenger_headers, _, _ = chat_setup
        notifs = client.get("/api/v1/notifications", headers=passenger_headers).json()["data"]
        notif_id = notifs[0]["id"]

        del_resp = client.delete(f"/api/v1/notifications/{notif_id}", headers=passenger_headers)
        assert del_resp.status_code == 200

        # Verify no longer in list
        after_notifs = client.get("/api/v1/notifications", headers=passenger_headers).json()["data"]
        assert not any(n["id"] == notif_id for n in after_notifs)
