import pytest
import random
from datetime import date, timedelta
from fastapi import status
from app.schemas.enums import VehicleType

CAR_VEHICLE = {
    "vehicle_type": VehicleType.CAR.value,
    "manufacturer": "Honda",
    "model": "Civic",
    "registration_number": "LOC-101",
    "color": "Black",
    "seat_capacity": 4,
    "is_active": True,
}

FUTURE_DATE = (date.today() + timedelta(days=5)).isoformat()


@pytest.fixture
def driver_with_active_vehicle(client):
    """Register unique driver user, create driver profile, add active vehicle, return headers."""
    rand_num = str(random.randint(1000000, 9999999))
    driver_payload = {
        "name": f"Driver {rand_num}",
        "mobile_number": f"+92300{rand_num}",
        "password": "Str0ng@Pass!",
    }
    driver_profile = {
        "cnic_number": f"42101-{rand_num}-1",
        "license_number": f"DL-KHI-{rand_num}",
    }

    reg = client.post("/api/v1/auth/register", json=driver_payload)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/drivers/profile", json=driver_profile, headers=headers)
    client.post("/api/v1/vehicles", json=CAR_VEHICLE, headers=headers)
    return headers


@pytest.fixture
def passenger_headers(client):
    """Register unique passenger account."""
    rand_num = str(random.randint(1000000, 9999999))
    passenger_payload = {
        "name": f"Passenger {rand_num}",
        "mobile_number": f"+92301{rand_num}",
        "password": "Str0ng@Pass!",
    }
    reg = client.post("/api/v1/auth/register", json=passenger_payload)
    token = reg.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def created_ride(client, driver_with_active_vehicle):
    """Publish a ride corridor for testing."""
    payload = {
        "pickup_area": "Clifton",
        "pickup_point": "Dolmen Mall Entrance",
        "destination_area": "I.I. Chundrigar Road",
        "destination_point": "Habib Bank Plaza",
        "departure_date": FUTURE_DATE,
        "departure_time": "08:30:00",
        "available_seats": 3,
        "fare_per_passenger": 300.0,
        "ride_notes": "Leaving on time.",
    }
    resp = client.post("/api/v1/rides", json=payload, headers=driver_with_active_vehicle)
    return resp.json()["data"]


def test_driver_location_update(client, driver_with_active_vehicle):
    """Driver posts valid location telemetry."""
    payload = {
        "latitude": 24.8607,
        "longitude": 67.0011,
        "heading": 120.5,
        "speed": 14.2,
        "accuracy": 12.0,
    }
    response = client.post("/api/v1/location/update", json=payload, headers=driver_with_active_vehicle)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["latitude"] == 24.8607
    assert data["longitude"] == 67.0011
    assert data["heading"] == 120.5


def test_passenger_cannot_publish_location(client, passenger_headers):
    """Passenger attempting to post driver location is rejected."""
    payload = {
        "latitude": 24.8607,
        "longitude": 67.0011,
    }
    response = client.post("/api/v1/location/update", json=payload, headers=passenger_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Driver profile required" in str(response.json())


def test_get_current_driver_location(client, driver_with_active_vehicle):
    """Driver fetches own last recorded location."""
    client.post(
        "/api/v1/location/update",
        json={"latitude": 24.9000, "longitude": 67.1000},
        headers=driver_with_active_vehicle,
    )

    response = client.get("/api/v1/location/current", headers=driver_with_active_vehicle)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["latitude"] == 24.9000


def test_passenger_location_access_unauthorized(client, passenger_headers, created_ride):
    """Unaccepted passenger cannot track driver location."""
    ride_id = created_ride["id"]
    response = client.get(f"/api/v1/location/ride/{ride_id}", headers=passenger_headers)
    print("DEBUG RES:", response.status_code, response.json())
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "BOOKING_004" in str(response.json())


def test_passenger_location_access_authorized_after_booking(
    client, driver_with_active_vehicle, passenger_headers, created_ride
):
    """Passenger with accepted booking request can access driver live location."""
    ride_id = created_ride["id"]

    # Driver publishes location
    client.post(
        "/api/v1/location/update",
        json={"latitude": 24.8138, "longitude": 67.0298, "ride_id": ride_id},
        headers=driver_with_active_vehicle,
    )

    # Passenger requests ride
    req_resp = client.post(
        "/api/v1/ride-requests",
        json={"ride_id": ride_id, "message": "Hi, reserving seat!"},
        headers=passenger_headers,
    )
    assert req_resp.status_code == status.HTTP_201_CREATED
    request_id = req_resp.json()["data"]["id"]

    # Driver accepts request
    accept_resp = client.patch(
        f"/api/v1/drivers/requests/{request_id}/accept",
        headers=driver_with_active_vehicle,
    )
    assert accept_resp.status_code == status.HTTP_200_OK

    # Passenger tracks driver location
    response = client.get(f"/api/v1/location/ride/{ride_id}", headers=passenger_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["latitude"] == 24.8138


def test_stop_location_tracking(client, driver_with_active_vehicle):
    """Driver stops location tracking."""
    client.post(
        "/api/v1/location/update",
        json={"latitude": 24.8607, "longitude": 67.0011},
        headers=driver_with_active_vehicle,
    )

    response = client.delete("/api/v1/location/stop", headers=driver_with_active_vehicle)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "stopped"

    fetch_resp = client.get("/api/v1/location/current", headers=driver_with_active_vehicle)
    assert fetch_resp.status_code == status.HTTP_404_NOT_FOUND
