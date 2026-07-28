"""
Integration tests for Ride Management Module (Sprint 8D).
"""
import pytest
from datetime import date, timedelta
from app.schemas.enums import RideStatus, VehicleType

DRIVER_USER = {
    "name": "Driver Published",
    "mobile_number": "+923007778899",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "Passenger Commuter",
    "mobile_number": "+923008889900",
    "password": "Str0ng@Pass!",
}

OTHER_DRIVER = {
    "name": "Other Driver",
    "mobile_number": "+923001119999",
    "password": "Str0ng@Pass!",
}

DRIVER_PROFILE = {
    "cnic_number": "42101-7777777-7",
    "license_number": "DL-KHI-RIDE-001",
}

CAR_VEHICLE = {
    "vehicle_type": VehicleType.CAR.value,
    "manufacturer": "Toyota",
    "model": "Corolla",
    "registration_number": "RIDE-101",
    "color": "Silver",
    "seat_capacity": 4,
    "is_active": True,
}

# Future departure date (7 days from today)
FUTURE_DATE = (date.today() + timedelta(days=7)).isoformat()
PAST_DATE = (date.today() - timedelta(days=2)).isoformat()

VALID_RIDE_PAYLOAD = {
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


@pytest.fixture
def driver_with_active_vehicle(client):
    """Register user, create driver profile, add active vehicle, return headers."""
    reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    p_resp = client.post("/api/v1/drivers/profile", json=DRIVER_PROFILE, headers=headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {new_token}"}
    client.post("/api/v1/vehicles", json=CAR_VEHICLE, headers=headers)
    return headers


@pytest.fixture
def passenger_headers(client):
    """Register passenger account only."""
    reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_driver_headers(client):
    """Register another driver account."""
    reg = client.post("/api/v1/auth/register", json=OTHER_DRIVER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-2222222-2", "license_number": "DL-002"}, headers=headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {new_token}"}
    client.post("/api/v1/vehicles", json={**CAR_VEHICLE, "registration_number": "RIDE-202"}, headers=headers)
    return headers



# ------------------------------------------------------------------ #
#  Publish Ride Tests                                                #
# ------------------------------------------------------------------ #

class TestPublishRide:

    def test_publish_ride_success(self, client, driver_with_active_vehicle):
        resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["pickup_area"] == "Clifton"
        assert body["data"]["destination_area"] == "I.I. Chundrigar Road"
        assert body["data"]["status"] == RideStatus.UPCOMING.value
        assert body["data"]["driver_summary"] is not None
        assert body["data"]["vehicle_summary"] is not None

    def test_publish_duplicate_active_ride_fails(self, client, driver_with_active_vehicle):
        client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        # 2nd attempt
        resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        assert resp.status_code == 409
        assert "[RIDE_001]" in resp.json()["message"]

    def test_publish_ride_past_date_fails(self, client, driver_with_active_vehicle):
        bad_payload = {**VALID_RIDE_PAYLOAD, "departure_date": PAST_DATE}
        resp = client.post("/api/v1/rides", json=bad_payload, headers=driver_with_active_vehicle)
        assert resp.status_code == 422 or resp.status_code == 400

    def test_publish_ride_exceeding_seats_fails(self, client, driver_with_active_vehicle):
        bad_payload = {**VALID_RIDE_PAYLOAD, "available_seats": 10}  # Car capacity is 4
        resp = client.post("/api/v1/rides", json=bad_payload, headers=driver_with_active_vehicle)
        assert resp.status_code == 400
        assert "[VALIDATION_001]" in resp.json()["message"]

    def test_passenger_cannot_publish_ride(self, client, passenger_headers):
        resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=passenger_headers)
        assert resp.status_code == 403
        assert "[RIDE_003]" in resp.json()["message"]

        p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-3333333-3", "license_number": "DL-003"}, headers=passenger_headers)
        new_token = p_resp.json()["data"]["tokens"]["access_token"]
        d_headers = {"Authorization": f"Bearer {new_token}"}
        resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=d_headers)

        assert resp.status_code == 400
        assert "[RIDE_002]" in resp.json()["message"]


# ------------------------------------------------------------------ #
#  Search & Ride Operations Tests                                     #
# ------------------------------------------------------------------ #

class TestRideOperations:

    def test_search_rides(self, client, driver_with_active_vehicle):
        client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)

        resp = client.get("/api/v1/rides?pickup_area=Clifton&destination_area=Chundrigar")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) >= 1
        assert data[0]["pickup_area"] == "Clifton"

    def test_get_ride_detail(self, client, driver_with_active_vehicle):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        resp = client.get(f"/api/v1/rides/{ride_id}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["id"] == ride_id
        assert body["data"]["vehicle_summary"]["registration_number"] == "RIDE-101"

    def test_cancel_ride_success(self, client, driver_with_active_vehicle):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        resp = client.patch(f"/api/v1/rides/{ride_id}/cancel", headers=driver_with_active_vehicle)
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == RideStatus.CANCELLED.value

    def test_complete_ride_success(self, client, driver_with_active_vehicle):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        resp = client.patch(f"/api/v1/rides/{ride_id}/complete", headers=driver_with_active_vehicle)
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == RideStatus.COMPLETED.value

    def test_completed_ride_immutable_fails_modification(self, client, driver_with_active_vehicle):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        # Complete ride
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=driver_with_active_vehicle)

        # Attempt to update completed ride
        upd_resp = client.patch(f"/api/v1/rides/{ride_id}", json={"pickup_area": "Gulshan"}, headers=driver_with_active_vehicle)
        assert upd_resp.status_code == 400
        assert "[RIDE_005]" in upd_resp.json()["message"]

    def test_other_driver_cannot_cancel_ride(self, client, driver_with_active_vehicle, other_driver_headers):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        resp = client.patch(f"/api/v1/rides/{ride_id}/cancel", headers=other_driver_headers)
        assert resp.status_code == 403

    def test_delete_ride_success(self, client, driver_with_active_vehicle):
        pub_resp = client.post("/api/v1/rides", json=VALID_RIDE_PAYLOAD, headers=driver_with_active_vehicle)
        ride_id = pub_resp.json()["data"]["id"]

        resp = client.delete(f"/api/v1/rides/{ride_id}", headers=driver_with_active_vehicle)
        assert resp.status_code == 200

        # Verify soft deleted
        get_resp = client.get(f"/api/v1/rides/{ride_id}")
        assert get_resp.status_code == 404
