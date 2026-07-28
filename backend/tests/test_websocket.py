import pytest
from uuid import uuid4
from fastapi import status
from app.schemas.enums import VehicleType

DRIVER_USER = {
    "name": "WS Driver",
    "mobile_number": "+923009988776",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "WS Passenger",
    "mobile_number": "+923008877665",
    "password": "Str0ng@Pass!",
}


@pytest.fixture
def driver_token(client):
    reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-9988776-1", "license_number": "DL-WS-1"}, headers=headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    return new_token, {"Authorization": f"Bearer {new_token}"}



@pytest.fixture
def passenger_token(client):
    reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return token, headers


def test_websocket_unauthorized_fails(client):
    """Connecting without a token or with an invalid token is rejected."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws") as websocket:
            pass

    with pytest.raises(Exception):
        with client.websocket_connect("/ws?token=invalid_token_xyz") as websocket:
            pass


def test_websocket_connect_and_heartbeat(client, driver_token):
    """Authenticated user connects, receives welcome frame, and responds to heartbeat ping."""
    token, _ = driver_token
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # 1. Receive welcome frame
        data = websocket.receive_json()
        assert data["event_type"] == "connect"
        assert "connection_id" in data["payload"]
        assert data["payload"]["reconnected"] is False

        # 2. Send heartbeat ping frame
        ping_frame = {
            "event_type": "heartbeat",
            "payload": {"type": "ping"},
        }
        websocket.send_json(ping_frame)

        # 3. Receive heartbeat pong frame
        pong = websocket.receive_json()
        assert pong["event_type"] == "heartbeat"
        assert pong["payload"]["type"] == "pong"
        assert "server_time" in pong["payload"]


def test_websocket_room_join_and_leave(client, passenger_token):
    """Subscriber joins and leaves ride room with acknowledgement frames."""
    token, _ = passenger_token
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        # Welcome
        websocket.receive_json()

        ride_room = f"ride:{uuid4()}"

        # Join room
        websocket.send_json({
            "event_type": "join_room",
            "room_id": ride_room,
            "payload": {"room_id": ride_room},
        })
        ack_join = websocket.receive_json()
        assert ack_join["event_type"] == "ack"
        assert ack_join["payload"]["action"] == "join_room"
        assert ack_join["payload"]["room_id"] == ride_room

        # Leave room
        websocket.send_json({
            "event_type": "leave_room",
            "room_id": ride_room,
            "payload": {"room_id": ride_room},
        })
        ack_leave = websocket.receive_json()
        assert ack_leave["event_type"] == "ack"
        assert ack_leave["payload"]["action"] == "leave_room"


def test_websocket_unauthorized_room_join_fails(client, passenger_token):
    """User attempting to join another user's private room is rejected with error frame."""
    token, _ = passenger_token
    other_user_id = str(uuid4())

    with client.websocket_connect(f"/ws?token={token}") as websocket:
        websocket.receive_json()

        websocket.send_json({
            "event_type": "join_room",
            "room_id": f"user:{other_user_id}",
            "payload": {"room_id": f"user:{other_user_id}"},
        })
        err_resp = websocket.receive_json()
        assert err_resp["event_type"] == "error"
        assert err_resp["payload"]["code"] == "UNAUTHORIZED_ROOM"


def test_websocket_stats_endpoint(client, passenger_token):
    """REST endpoint /api/v1/ws/stats returns real-time metrics."""
    _, headers = passenger_token
    resp = client.get("/api/v1/ws/stats", headers=headers)
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "active_connections" in data
    assert "connected_drivers" in data
    assert "connected_passengers" in data
    assert "room_count" in data
