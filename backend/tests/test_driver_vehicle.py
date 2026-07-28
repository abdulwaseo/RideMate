"""
Integration tests for Driver Profile & Vehicle Management (Sprint 8C).
"""
import pytest
from app.schemas.enums import UserRole, VehicleType

# Shared user payloads
USER_1 = {
    "name": "Driver One",
    "mobile_number": "+923001112233",
    "password": "Str0ng@Pass!",
}

USER_2 = {
    "name": "Passenger Two",
    "mobile_number": "+923004445566",
    "password": "Str0ng@Pass!",
}

DRIVER_PAYLOAD_1 = {
    "cnic_number": "42101-1234567-1",
    "license_number": "DL-KHI-2023-001",
}

DRIVER_PAYLOAD_2 = {
    "cnic_number": "42101-9999999-9",
    "license_number": "DL-KHI-2023-002",
}

CAR_PAYLOAD_1 = {
    "vehicle_type": VehicleType.CAR.value,
    "manufacturer": "Honda",
    "model": "Civic 2022",
    "registration_number": "ABC-123",
    "color": "Black",
    "seat_capacity": 4,
    "is_active": True,
}

CAR_PAYLOAD_2 = {
    "vehicle_type": VehicleType.CAR.value,
    "manufacturer": "Toyota",
    "model": "Corolla 2021",
    "registration_number": "XYZ-789",
    "color": "White",
    "seat_capacity": 3,
    "is_active": False,
}

BIKE_PAYLOAD = {
    "vehicle_type": VehicleType.BIKE.value,
    "manufacturer": "Yamaha",
    "model": "YBR 125",
    "registration_number": "KHI-555",
    "color": "Red",
    "seat_capacity": 1,
    "is_active": False,
}


@pytest.fixture
def auth_driver_headers(client):
    """Register user, create driver profile, return auth headers with elevated token."""
    reg = client.post("/api/v1/auth/register", json=USER_1)
    access_token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    profile_resp = client.post("/api/v1/drivers/profile", json=DRIVER_PAYLOAD_1, headers=headers)
    new_token = profile_resp.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {new_token}"}



@pytest.fixture
def auth_passenger_headers(client):
    """Register passenger account only, return auth headers."""
    reg = client.post("/api/v1/auth/register", json=USER_2)
    access_token = reg.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


# ------------------------------------------------------------------ #
#  Driver Profile Tests                                               #
# ------------------------------------------------------------------ #

class TestDriverProfile:

    def test_create_driver_profile_success(self, client, auth_passenger_headers):
        resp = client.post(
            "/api/v1/drivers/profile",
            json=DRIVER_PAYLOAD_2,
            headers=auth_passenger_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["cnic_number"] == DRIVER_PAYLOAD_2["cnic_number"]
        assert body["data"]["license_number"] == DRIVER_PAYLOAD_2["license_number"]
        assert body["data"]["verification_status"] == "Pending"

        # Verify role elevated to DRIVER using re-issued elevated token
        new_token = body["data"]["tokens"]["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}
        me_resp = client.get("/api/v1/auth/me", headers=new_headers)
        assert me_resp.json()["data"]["role"] == UserRole.DRIVER.value


    def test_create_duplicate_driver_profile_fails(self, client, auth_driver_headers):
        resp = client.post(
            "/api/v1/drivers/profile",
            json={
                "cnic_number": "42101-8888888-8",
                "license_number": "DL-KHI-NEW-001",
            },
            headers=auth_driver_headers,
        )
        assert resp.status_code == 409
        assert "[DRIVER_001]" in resp.json()["message"]

    def test_get_driver_profile_success(self, client, auth_driver_headers):
        resp = client.get("/api/v1/drivers/profile", headers=auth_driver_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["cnic_number"] == DRIVER_PAYLOAD_1["cnic_number"]

    def test_get_driver_profile_not_found(self, client, auth_passenger_headers):
        resp = client.get("/api/v1/drivers/profile", headers=auth_passenger_headers)
        assert resp.status_code == 404
        assert "[DRIVER_002]" in resp.json()["message"]

    def test_update_driver_profile_success(self, client, auth_driver_headers):
        resp = client.patch(
            "/api/v1/drivers/profile",
            json={"license_number": "DL-KHI-UPDATED-99"},
            headers=auth_driver_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["license_number"] == "DL-KHI-UPDATED-99"

    def test_invalid_cnic_format_fails(self, client, auth_passenger_headers):
        resp = client.post(
            "/api/v1/drivers/profile",
            json={"cnic_number": "invalid-cnic", "license_number": "DL-KHI-12345"},
            headers=auth_passenger_headers,
        )
        assert resp.status_code == 422

    def test_unauthorized_driver_profile_access(self, client):
        resp = client.get("/api/v1/drivers/profile")
        assert resp.status_code == 401


# ------------------------------------------------------------------ #
#  Vehicle Garage Tests                                               #
# ------------------------------------------------------------------ #

class TestVehicles:

    def test_add_car_success(self, client, auth_driver_headers):
        resp = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["registration_number"] == "ABC-123"
        assert body["data"]["is_active"] is True  # 1st vehicle default active

    def test_add_bike_seat_capacity_validation(self, client, auth_driver_headers):
        bad_bike = {**BIKE_PAYLOAD, "seat_capacity": 3}
        resp = client.post("/api/v1/vehicles", json=bad_bike, headers=auth_driver_headers)
        assert resp.status_code == 422

    def test_add_car_seat_capacity_validation(self, client, auth_driver_headers):
        bad_car = {**CAR_PAYLOAD_1, "seat_capacity": 10}
        resp = client.post("/api/v1/vehicles", json=bad_car, headers=auth_driver_headers)
        assert resp.status_code == 422

    def test_duplicate_registration_number_fails(self, client, auth_driver_headers):
        client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers)
        resp = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers)
        assert resp.status_code == 409
        assert "[VEHICLE_002]" in resp.json()["message"]

    def test_list_vehicles(self, client, auth_driver_headers):
        client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers)
        client.post("/api/v1/vehicles", json=CAR_PAYLOAD_2, headers=auth_driver_headers)

        resp = client.get("/api/v1/vehicles", headers=auth_driver_headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 2

    def test_activate_vehicle(self, client, auth_driver_headers):
        v1 = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers).json()["data"]
        v2 = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_2, headers=auth_driver_headers).json()["data"]

        # v1 is active initially
        assert v1["is_active"] is True

        # Activate v2
        resp = client.patch(f"/api/v1/vehicles/{v2['id']}/activate", headers=auth_driver_headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["is_active"] is True

        # Verify v1 is now deactivated
        v1_updated = client.get(f"/api/v1/vehicles/{v1['id']}", headers=auth_driver_headers).json()["data"]
        assert v1_updated["is_active"] is False

    def test_delete_inactive_vehicle_success(self, client, auth_driver_headers):
        client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers)
        v2 = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_2, headers=auth_driver_headers).json()["data"]

        resp = client.delete(f"/api/v1/vehicles/{v2['id']}", headers=auth_driver_headers)
        assert resp.status_code == 200

        # Verify soft deleted
        get_resp = client.get(f"/api/v1/vehicles/{v2['id']}", headers=auth_driver_headers)
        assert get_resp.status_code == 404

    def test_delete_active_vehicle_when_multiple_exist_fails(self, client, auth_driver_headers):
        v1 = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_driver_headers).json()["data"]
        client.post("/api/v1/vehicles", json=CAR_PAYLOAD_2, headers=auth_driver_headers)

        resp = client.delete(f"/api/v1/vehicles/{v1['id']}", headers=auth_driver_headers)
        assert resp.status_code == 400
        assert "[VEHICLE_003]" in resp.json()["message"]

    def test_passenger_cannot_add_vehicle(self, client, auth_passenger_headers):
        resp = client.post("/api/v1/vehicles", json=CAR_PAYLOAD_1, headers=auth_passenger_headers)
        assert resp.status_code == 403
        assert "[DRIVER_002]" in resp.json()["message"]
