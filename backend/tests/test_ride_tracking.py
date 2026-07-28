import pytest
import math
from datetime import date, timedelta
from uuid import uuid4
from fastapi import status
from app.schemas.enums import VehicleType
from app.services.eta_service import ETAService

DRIVER_USER = {
    "name": "Tracking Driver",
    "mobile_number": "+923001122334",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "Tracking Passenger",
    "mobile_number": "+923002233445",
    "password": "Str0ng@Pass!",
}

OUTSIDER_USER = {
    "name": "Tracking Outsider",
    "mobile_number": "+923003344556",
    "password": "Str0ng@Pass!",
}

FUTURE_DATE = (date.today() + timedelta(days=3)).isoformat()


@pytest.fixture
def tracking_setup(client):
    """Registers driver + passenger, publishes ride, accepts booking. Returns auth headers and ride_id."""
    # Driver registration + profile + vehicle
    d_reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    d_token = d_reg.json()["data"]["tokens"]["access_token"]
    d_headers = {"Authorization": f"Bearer {d_token}"}

    p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-1122334-1", "license_number": "DL-1122"}, headers=d_headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    d_headers = {"Authorization": f"Bearer {new_token}"}

    client.post("/api/v1/vehicles", json={
        "vehicle_type": VehicleType.CAR.value,
        "manufacturer": "Honda",
        "model": "Civic",
        "registration_number": "KHI-TRK1",
        "color": "Black",
        "seat_capacity": 4,
        "is_active": True,
    }, headers=d_headers)

    pub_resp = client.post("/api/v1/rides", json={
        "pickup_area": "DHA",
        "pickup_point": "Phase 5",
        "destination_area": "Gulshan",
        "destination_point": "Block 10",
        "departure_date": FUTURE_DATE,
        "departure_time": "08:00:00",
        "available_seats": 3,
        "fare_per_passenger": 250.0,
    }, headers=d_headers)
    ride_id = pub_resp.json()["data"]["id"]

    # Passenger booking
    p_reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    p_token = p_reg.json()["data"]["tokens"]["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id, "message": "Need tracking test"}, headers=p_headers)
    req_id = req_resp.json()["data"]["id"]
    client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=d_headers)

    # Outsider
    o_reg = client.post("/api/v1/auth/register", json=OUTSIDER_USER)
    o_token = o_reg.json()["data"]["tokens"]["access_token"]
    o_headers = {"Authorization": f"Bearer {o_token}"}

    return {
        "ride_id": ride_id,
        "driver_headers": d_headers,
        "passenger_headers": p_headers,
        "outsider_headers": o_headers,
        "driver_token": d_token,
        "passenger_token": p_token,
    }


# ─── ETA Service Unit Tests ────────────────────────────────────────────────────

def test_eta_haversine_calculation():
    """ETAService.haversine_km returns correct distance between two known coordinates."""
    svc = ETAService()
    # Karachi city hall → Clifton: approx 4-6 km
    km = svc.haversine_km(24.8607, 67.0011, 24.8267, 67.0299)
    assert 3.0 < km < 8.0


def test_eta_calculation_returns_valid_payload():
    """ETAService.calculate_eta returns ETA payload with valid fields."""
    svc = ETAService()
    eta = svc.calculate_eta(
        current_lat=24.8607,
        current_lon=67.0011,
        dest_lat=24.8267,
        dest_lon=67.0299,
        speed_kmh=40.0,
        ride_id=str(uuid4()),
    )
    assert eta.eta_minutes is not None
    assert eta.eta_minutes > 0
    assert eta.remaining_distance_km is not None
    assert eta.remaining_distance_km > 0
    assert not eta.is_delayed


def test_eta_slow_speed_uses_default():
    """ETAService uses default urban speed when driver speed < 5 km/h."""
    svc = ETAService()
    eta_slow = svc.calculate_eta(
        current_lat=24.8607, current_lon=67.0011,
        dest_lat=24.8267, dest_lon=67.0299,
        speed_kmh=2.0,  # very slow -> fallback to DEFAULT_SPEED_KMH
        ride_id="test"
    )
    eta_default = svc.calculate_eta(
        current_lat=24.8607, current_lon=67.0011,
        dest_lat=24.8267, dest_lon=67.0299,
        speed_kmh=None,
        ride_id="test"
    )
    assert abs(eta_slow.eta_minutes - eta_default.eta_minutes) < 0.5


def test_route_progress_calculation():
    """ETAService.get_progress_percent returns 0 at start, approaching 100 at end."""
    svc = ETAService()
    start_lat, start_lon = 24.8607, 67.0011
    dest_lat, dest_lon = 24.8267, 67.0299

    # At start
    pct_start = svc.get_progress_percent(start_lat, start_lon, start_lat, start_lon, dest_lat, dest_lon)
    assert pct_start == 0.0

    # Near destination
    pct_end = svc.get_progress_percent(dest_lat, dest_lon, start_lat, start_lon, dest_lat, dest_lon)
    assert pct_end > 95.0


# ─── Tracking Session REST API Tests ──────────────────────────────────────────

def test_tracking_session_start(client, tracking_setup):
    """Driver can start a tracking session for their ride."""
    ride_id = tracking_setup["ride_id"]
    resp = client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["driver_headers"])
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()["data"]
    assert data["ride_id"] == ride_id
    assert data["current_status"] == "Preparing"


def test_tracking_session_get_active(client, tracking_setup):
    """Driver and passenger can get active tracking session."""
    ride_id = tracking_setup["ride_id"]
    client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["driver_headers"])

    # Driver view
    d_resp = client.get(f"/api/v1/tracking/{ride_id}/session", headers=tracking_setup["driver_headers"])
    assert d_resp.status_code == status.HTTP_200_OK
    assert d_resp.json()["data"]["current_status"] == "Preparing"

    # Passenger view
    p_resp = client.get(f"/api/v1/tracking/{ride_id}/session", headers=tracking_setup["passenger_headers"])
    assert p_resp.status_code == status.HTTP_200_OK


def test_unauthorized_tracking_access(client, tracking_setup):
    """Outsider cannot access tracking session."""
    ride_id = tracking_setup["ride_id"]
    client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["driver_headers"])

    resp = client.get(f"/api/v1/tracking/{ride_id}/session", headers=tracking_setup["outsider_headers"])
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_tracking_session_stop(client, tracking_setup):
    """Driver can stop their tracking session."""
    ride_id = tracking_setup["ride_id"]
    client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["driver_headers"])

    stop_resp = client.post(f"/api/v1/tracking/{ride_id}/stop", headers=tracking_setup["driver_headers"])
    assert stop_resp.status_code == status.HTTP_200_OK
    assert stop_resp.json()["data"]["current_status"] == "Completed"
    assert stop_resp.json()["data"]["ended_at"] is not None


def test_passenger_cannot_start_tracking(client, tracking_setup):
    """Passenger cannot start a tracking session — driver-only operation."""
    ride_id = tracking_setup["ride_id"]
    resp = client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["passenger_headers"])
    assert resp.status_code == status.HTTP_403_FORBIDDEN


# ─── WebSocket Tracking Tests ──────────────────────────────────────────────────

def test_tracking_websocket_start_event(client, tracking_setup):
    """Driver sends ride_tracking_start via WebSocket, receives broadcast."""
    ride_id = tracking_setup["ride_id"]
    d_token = tracking_setup["driver_token"]

    with client.websocket_connect(f"/ws?token={d_token}") as ws:
        ws.receive_json()  # welcome frame
        ws.send_json({
            "event_type": "ride_tracking_start",
            "payload": {"ride_id": ride_id},
        })
        response = ws.receive_json()
        assert response["event_type"] == "ride_tracking_start"
        assert response["payload"]["ride_id"] == ride_id


def test_tracking_websocket_location_update(client, tracking_setup):
    """Driver sends location_updated via WebSocket, receives LOCATION_UPDATED and ETA_UPDATED."""
    ride_id = tracking_setup["ride_id"]
    d_token = tracking_setup["driver_token"]

    # Start session first via REST
    client.post(f"/api/v1/tracking/{ride_id}/start", headers=tracking_setup["driver_headers"])

    with client.websocket_connect(f"/ws?token={d_token}") as ws:
        ws.receive_json()  # welcome

        # Join the ride room first so the broadcast reaches this connection
        ws.send_json({"event_type": "join_room", "payload": {"room_id": f"ride:{ride_id}"}})
        ws.receive_json()  # join_room ack

        ws.send_json({
            "event_type": "location_updated",
            "payload": {
                "ride_id": ride_id,
                "latitude": 24.8607,
                "longitude": 67.0011,
                "speed": 40.0,
                "heading": 90.0,
                "accuracy": 5.0,
            },
        })

        # Receives LOCATION_UPDATED broadcast
        loc_event = ws.receive_json()
        assert loc_event["event_type"] == "location_updated"
        assert loc_event["payload"]["latitude"] == 24.8607

        # Receives ETA_UPDATED broadcast
        eta_event = ws.receive_json()
        assert eta_event["event_type"] == "eta_updated"
        assert "eta_minutes" in eta_event["payload"]
