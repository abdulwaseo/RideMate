import pytest
from datetime import date, timedelta
from uuid import uuid4
from fastapi import status
from app.schemas.enums import VehicleType

DRIVER_USER = {
    "name": "Chat Driver",
    "mobile_number": "+923007711223",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "Chat Passenger",
    "mobile_number": "+923007722334",
    "password": "Str0ng@Pass!",
}

UNAUTHORIZED_USER = {
    "name": "Chat Intruder",
    "mobile_number": "+923007733445",
    "password": "Str0ng@Pass!",
}

FUTURE_DATE = (date.today() + timedelta(days=5)).isoformat()


@pytest.fixture
def driver_and_passenger_with_confirmed_booking(client):
    """Register driver & passenger, publish ride, request seat, accept booking -> produces ChatRoom."""
    # Driver
    d_reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    d_token = d_reg.json()["data"]["tokens"]["access_token"]
    d_headers = {"Authorization": f"Bearer {d_token}"}

    client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-7711223-1", "license_number": "DL-771"}, headers=d_headers)
    client.post("/api/v1/vehicles", json={
        "vehicle_type": VehicleType.CAR.value,
        "manufacturer": "Toyota",
        "model": "Corolla",
        "registration_number": "KHI-999",
        "color": "White",
        "seat_capacity": 4,
        "is_active": True,
    }, headers=d_headers)

    pub_resp = client.post("/api/v1/rides", json={
        "pickup_area": "Clifton",
        "pickup_point": "Block 2",
        "destination_area": "Saddar",
        "destination_point": "Empress Market",
        "departure_date": FUTURE_DATE,
        "departure_time": "09:00:00",
        "available_seats": 3,
        "fare_per_passenger": 200.0,
    }, headers=d_headers)
    ride_id = pub_resp.json()["data"]["id"]

    # Passenger
    p_reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    p_token = p_reg.json()["data"]["tokens"]["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id, "message": "Hi, seat please!"}, headers=p_headers)
    req_id = req_resp.json()["data"]["id"]

    # Driver accepts request
    client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=d_headers)

    # Fetch room
    rooms_resp = client.get("/api/v1/chat/rooms", headers=d_headers)
    room = rooms_resp.json()["data"][0]

    # Intruder
    u_reg = client.post("/api/v1/auth/register", json=UNAUTHORIZED_USER)
    u_token = u_reg.json()["data"]["tokens"]["access_token"]
    u_headers = {"Authorization": f"Bearer {u_token}"}

    return {
        "driver_token": d_token,
        "driver_headers": d_headers,
        "passenger_token": p_token,
        "passenger_headers": p_headers,
        "intruder_headers": u_headers,
        "ride_id": ride_id,
        "room_id": room["id"],
    }


def test_chat_room_participant_authorization(client, driver_and_passenger_with_confirmed_booking):
    """Driver and passenger can access room details, but intruder is forbidden."""
    setup = driver_and_passenger_with_confirmed_booking
    room_id = setup["room_id"]

    # Driver access
    d_resp = client.get(f"/api/v1/chat/rooms/{room_id}", headers=setup["driver_headers"])
    assert d_resp.status_code == status.HTTP_200_OK

    # Passenger access
    p_resp = client.get(f"/api/v1/chat/rooms/{room_id}", headers=setup["passenger_headers"])
    assert p_resp.status_code == status.HTTP_200_OK

    # Intruder access rejected
    i_resp = client.get(f"/api/v1/chat/rooms/{room_id}", headers=setup["intruder_headers"])
    assert i_resp.status_code == status.HTTP_403_FORBIDDEN


def test_realtime_message_send_and_receive(client, driver_and_passenger_with_confirmed_booking):
    """Passenger posts message via REST, driver receives and lists history."""
    setup = driver_and_passenger_with_confirmed_booking
    room_id = setup["room_id"]

    msg_resp = client.post(
        f"/api/v1/chat/rooms/{room_id}/messages",
        json={"content": "Hey Driver, I am ready at main entrance!"},
        headers=setup["passenger_headers"],
    )
    assert msg_resp.status_code == status.HTTP_201_CREATED
    msg_data = msg_resp.json()["data"]
    assert msg_data["content"] == "Hey Driver, I am ready at main entrance!"
    assert msg_data["sender_name"] == "Chat Passenger"

    # Driver fetches message history
    hist_resp = client.get(f"/api/v1/chat/rooms/{room_id}/messages", headers=setup["driver_headers"])
    assert hist_resp.status_code == status.HTTP_200_OK
    messages = hist_resp.json()["data"]
    assert len(messages) >= 1
    assert messages[-1]["content"] == "Hey Driver, I am ready at main entrance!"


def test_realtime_websocket_chat_join_and_send(client, driver_and_passenger_with_confirmed_booking):
    """Passenger sends chat message via WebSocket frame and receives room broadcast."""
    setup = driver_and_passenger_with_confirmed_booking
    p_token = setup["passenger_token"]
    room_id = setup["room_id"]
    chat_channel = f"chat:{room_id}"

    with client.websocket_connect(f"/ws?token={p_token}") as websocket:
        # Welcome
        websocket.receive_json()

        # Join chat room
        websocket.send_json({
            "event_type": "chat_join",
            "room_id": chat_channel,
            "payload": {"room_id": chat_channel},
        })
        ack = websocket.receive_json()
        assert ack["event_type"] == "chat_join"
        assert ack["payload"]["status"] == "joined"

        # Send message
        websocket.send_json({
            "event_type": "message_send",
            "room_id": chat_channel,
            "payload": {"room_id": chat_channel, "content": "WebSocket message text!"},
        })

        broadcast = websocket.receive_json()
        assert broadcast["event_type"] == "message_received"
        assert broadcast["payload"]["content"] == "WebSocket message text!"


def test_message_edit_and_soft_delete(client, driver_and_passenger_with_confirmed_booking):
    """Passenger posts, edits, and soft deletes message."""
    setup = driver_and_passenger_with_confirmed_booking
    room_id = setup["room_id"]
    headers = setup["passenger_headers"]

    # 1. Post
    post_resp = client.post(f"/api/v1/chat/rooms/{room_id}/messages", json={"content": "Original message text"}, headers=headers)
    msg_id = post_resp.json()["data"]["id"]

    # 2. Edit
    edit_resp = client.put(f"/api/v1/chat/rooms/{room_id}/messages/{msg_id}", json={"content": "Updated message text"}, headers=headers)
    assert edit_resp.status_code == status.HTTP_200_OK
    assert edit_resp.json()["data"]["content"] == "Updated message text"
    assert edit_resp.json()["data"]["is_edited"] is True

    # 3. Soft Delete
    del_resp = client.delete(f"/api/v1/chat/rooms/{room_id}/messages/{msg_id}", headers=headers)
    assert del_resp.status_code == status.HTTP_200_OK
    assert del_resp.json()["data"]["is_deleted"] is True


def test_message_read_receipts(client, driver_and_passenger_with_confirmed_booking):
    """Driver marks passenger message as read."""
    setup = driver_and_passenger_with_confirmed_booking
    room_id = setup["room_id"]

    # Passenger posts message
    post_resp = client.post(f"/api/v1/chat/rooms/{room_id}/messages", json={"content": "Read receipt test message"}, headers=setup["passenger_headers"])
    msg_id = post_resp.json()["data"]["id"]

    # Driver marks read
    read_resp = client.post(
        f"/api/v1/chat/rooms/{room_id}/read",
        json={"message_ids": [msg_id]},
        headers=setup["driver_headers"],
    )
    assert read_resp.status_code == status.HTTP_200_OK
    assert read_resp.json()["data"]["marked_count"] == 1

    # Passenger checks message history and verifies read_count == 1
    hist = client.get(f"/api/v1/chat/rooms/{room_id}/messages", headers=setup["passenger_headers"]).json()["data"]
    target_msg = next(m for m in hist if m["id"] == msg_id)
    assert target_msg["read_count"] == 1
