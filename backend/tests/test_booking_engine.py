"""
Integration tests for Ride Request & Booking Engine Module (Sprint 8E).
"""
import pytest
from datetime import date, timedelta
from app.schemas.enums import BookingStatus, ConfirmedBookingStatus, RideStatus, VehicleType

DRIVER_USER = {
    "name": "Driver Publisher",
    "mobile_number": "+923001112233",
    "password": "Str0ng@Pass!",
}

PASSENGER_1 = {
    "name": "Passenger One",
    "mobile_number": "+923002223344",
    "password": "Str0ng@Pass!",
}

PASSENGER_2 = {
    "name": "Passenger Two",
    "mobile_number": "+923003334455",
    "password": "Str0ng@Pass!",
}

FUTURE_DATE = (date.today() + timedelta(days=5)).isoformat()

BIKE_RIDE_PAYLOAD = {
    "pickup_area": "Gulshan-e-Iqbal",
    "pickup_point": "NIPA Chowrangi",
    "destination_area": "Saddar",
    "destination_point": "Karachi Press Club",
    "departure_date": FUTURE_DATE,
    "departure_time": "09:00:00",
    "available_seats": 1,  # 1 seat max for Bike
    "fare_per_passenger": 150.0,
}


@pytest.fixture
def driver_with_ride(client):
    """Setup driver, active bike vehicle, and published 1-seat ride."""
    reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-1111111-1", "license_number": "DL-111"}, headers=headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {new_token}"}

    client.post("/api/v1/vehicles", json={
        "vehicle_type": VehicleType.BIKE.value,
        "manufacturer": "Honda",
        "model": "CD70",
        "registration_number": "KHI-777",
        "color": "Black",
        "seat_capacity": 1,
        "is_active": True,
    }, headers=headers)

    pub = client.post("/api/v1/rides", json=BIKE_RIDE_PAYLOAD, headers=headers)
    ride_id = pub.json()["data"]["id"]
    return headers, ride_id



@pytest.fixture
def passenger1_headers(client):
    reg = client.post("/api/v1/auth/register", json=PASSENGER_1)
    token = reg.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def passenger2_headers(client):
    reg = client.post("/api/v1/auth/register", json=PASSENGER_2)
    token = reg.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ------------------------------------------------------------------ #
#  Ride Request Creation Tests                                       #
# ------------------------------------------------------------------ #

class TestRideRequests:

    def test_create_ride_request_success(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride
        resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id, "message": "Can I join?"}, headers=passenger1_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["status"] == BookingStatus.PENDING.value
        assert body["data"]["passenger_summary"]["name"] == "Passenger One"

    def test_request_own_ride_fails(self, client, driver_with_ride):
        driver_headers, ride_id = driver_with_ride
        resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=driver_headers)
        assert resp.status_code == 400
        assert "[REQ_002]" in resp.json()["message"]

    def test_duplicate_active_request_fails(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride
        # First request
        client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers)

        # Second attempt
        resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers)
        assert resp.status_code == 409
        assert "[REQ_001]" in resp.json()["message"]

    def test_passenger_cancel_pending_request(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride
        req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers)
        req_id = req_resp.json()["data"]["id"]

        del_resp = client.delete(f"/api/v1/ride-requests/{req_id}", headers=passenger1_headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["data"]["status"] == BookingStatus.CANCELLED.value

    def test_passenger_cancel_accepted_request_restores_seats(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride

        # 1. Passenger submits request
        req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers)
        req_id = req_resp.json()["data"]["id"]

        # 2. Driver accepts request (seats decremented to 0, ride becomes FULL)
        acc_resp = client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=driver_headers)
        assert acc_resp.status_code == 200
        assert acc_resp.json()["data"]["ride_summary"]["status"] == RideStatus.FULL.value

        # 3. Passenger cancels accepted request
        del_resp = client.delete(f"/api/v1/ride-requests/{req_id}", headers=passenger1_headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["data"]["status"] == BookingStatus.CANCELLED.value

        # 4. Verify ride status reverts from FULL to UPCOMING and seat is restored
        ride_resp = client.get(f"/api/v1/rides/{ride_id}")
        assert ride_resp.json()["data"]["status"] == RideStatus.UPCOMING.value
        assert ride_resp.json()["data"]["available_seats"] == 1



# ------------------------------------------------------------------ #
#  Driver Accept/Reject & Booking Flow Tests                          #
# ------------------------------------------------------------------ #

class TestBookingFlow:

    def test_driver_accept_request_creates_booking_and_marks_full(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride

        # 1. Passenger submits request
        req_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers)
        req_id = req_resp.json()["data"]["id"]

        # 2. Driver accepts request
        acc_resp = client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=driver_headers)
        assert acc_resp.status_code == 200
        body = acc_resp.json()
        assert body["data"]["booking_status"] == ConfirmedBookingStatus.CONFIRMED.value
        assert body["data"]["ride_summary"]["status"] == RideStatus.FULL.value

        # 3. Verify ride detail shows FULL and 0 seats remaining
        ride_resp = client.get(f"/api/v1/rides/{ride_id}")
        assert ride_resp.json()["data"]["status"] == RideStatus.FULL.value
        assert ride_resp.json()["data"]["available_seats"] == 0

    def test_full_ride_rejects_new_requests(self, client, driver_with_ride, passenger1_headers, passenger2_headers):
        driver_headers, ride_id = driver_with_ride

        # P1 requests & driver accepts (filling 1/1 seat)
        req1 = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers).json()["data"]["id"]
        client.patch(f"/api/v1/drivers/requests/{req1}/accept", headers=driver_headers)

        # P2 attempts to request now-full ride
        req2_resp = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger2_headers)
        assert req2_resp.status_code == 400
        assert "[REQ_003]" in req2_resp.json()["message"]

    def test_driver_reject_request_success(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride
        req_id = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers).json()["data"]["id"]

        rej_resp = client.patch(f"/api/v1/drivers/requests/{req_id}/reject", headers=driver_headers)
        assert rej_resp.status_code == 200
        assert rej_resp.json()["data"]["status"] == BookingStatus.REJECTED.value

    def test_cancel_confirmed_booking_reverts_ride_to_upcoming(self, client, driver_with_ride, passenger1_headers):
        driver_headers, ride_id = driver_with_ride

        # Accept request -> Booking created -> Ride FULL
        req_id = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=passenger1_headers).json()["data"]["id"]
        acc_resp = client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=driver_headers)
        booking_id = acc_resp.json()["data"]["id"]

        # Passenger cancels booking
        can_resp = client.patch(f"/api/v1/bookings/{booking_id}/cancel", headers=passenger1_headers)
        assert can_resp.status_code == 200
        assert can_resp.json()["data"]["booking_status"] == ConfirmedBookingStatus.CANCELLED.value

        # Verify ride status reverted to UPCOMING with 1 seat available
        ride_resp = client.get(f"/api/v1/rides/{ride_id}")
        assert ride_resp.json()["data"]["status"] == RideStatus.UPCOMING.value
        assert ride_resp.json()["data"]["available_seats"] == 1
