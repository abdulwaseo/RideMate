"""
Integration tests for Ratings, Reviews & Dashboard Module (Sprint 8G).
"""
import pytest
from datetime import date, timedelta
from app.schemas.enums import VehicleType

DRIVER_USER = {
    "name": "Rating Driver",
    "mobile_number": "+923005556677",
    "password": "Str0ng@Pass!",
}

PASSENGER_USER = {
    "name": "Rating Passenger",
    "mobile_number": "+923006667788",
    "password": "Str0ng@Pass!",
}

OUTSIDER_USER = {
    "name": "Outsider User",
    "mobile_number": "+923007778899",
    "password": "Str0ng@Pass!",
}

FUTURE_DATE = (date.today() + timedelta(days=2)).isoformat()


@pytest.fixture
def rating_setup(client):
    """Setup driver, passenger, published ride, request, accept, and completed ride."""
    # 1. Register driver
    d_reg = client.post("/api/v1/auth/register", json=DRIVER_USER)
    d_token = d_reg.json()["data"]["tokens"]["access_token"]
    d_user_id = d_reg.json()["data"]["user"]["id"]
    d_headers = {"Authorization": f"Bearer {d_token}"}

    p_resp = client.post("/api/v1/drivers/profile", json={"cnic_number": "42101-5555555-5", "license_number": "DL-555"}, headers=d_headers)
    new_token = p_resp.json()["data"]["tokens"]["access_token"]
    d_headers = {"Authorization": f"Bearer {new_token}"}

    client.post("/api/v1/vehicles", json={
        "vehicle_type": VehicleType.CAR.value,
        "manufacturer": "Suzuki",
        "model": "Cultus",
        "registration_number": "RATE-555",
        "color": "Grey",
        "seat_capacity": 3,
        "is_active": True,
    }, headers=d_headers)

    pub_resp = client.post("/api/v1/rides", json={
        "pickup_area": "Gulberg",
        "pickup_point": "Main Boulevard",
        "destination_area": "DHA",
        "destination_point": "Phase 5 Commercial",
        "departure_date": FUTURE_DATE,
        "departure_time": "10:00:00",
        "available_seats": 2,
        "fare_per_passenger": 250.0,
    }, headers=d_headers)
    ride_id = pub_resp.json()["data"]["id"]

    # 2. Register passenger
    p_reg = client.post("/api/v1/auth/register", json=PASSENGER_USER)
    p_token = p_reg.json()["data"]["tokens"]["access_token"]
    p_user_id = p_reg.json()["data"]["user"]["id"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    # 3. Register outsider
    o_reg = client.post("/api/v1/auth/register", json=OUTSIDER_USER)
    o_token = o_reg.json()["data"]["tokens"]["access_token"]
    o_headers = {"Authorization": f"Bearer {o_token}"}

    # 4. Request & Accept booking
    req_id = client.post("/api/v1/ride-requests", json={"ride_id": ride_id}, headers=p_headers).json()["data"]["id"]
    client.patch(f"/api/v1/drivers/requests/{req_id}/accept", headers=d_headers)

    return d_headers, p_headers, o_headers, ride_id, d_user_id, p_user_id


# ------------------------------------------------------------------ #
#  Rating & Review Tests                                             #
# ------------------------------------------------------------------ #

class TestRatingsModule:

    def test_rate_before_ride_completion_fails(self, client, rating_setup):
        _, p_headers, _, ride_id, d_user_id, _ = rating_setup
        resp = client.post("/api/v1/ratings", json={
            "ride_id": ride_id,
            "reviewee_id": d_user_id,
            "score": 5,
            "review": "Awesome trip!",
        }, headers=p_headers)
        assert resp.status_code == 400
        assert "[RATING_003]" in resp.json()["message"]

    def test_submit_rating_success(self, client, rating_setup):
        d_headers, p_headers, _, ride_id, d_user_id, p_user_id = rating_setup

        # Mark ride as COMPLETED
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        # Passenger rates driver
        resp = client.post("/api/v1/ratings", json={
            "ride_id": ride_id,
            "reviewee_id": d_user_id,
            "score": 5,
            "review": "Very punctual and polite driver!",
        }, headers=p_headers)

        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["score"] == 5
        assert body["data"]["review"] == "Very punctual and polite driver!"

    def test_duplicate_rating_fails(self, client, rating_setup):
        d_headers, p_headers, _, ride_id, d_user_id, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        # 1st rating
        client.post("/api/v1/ratings", json={"ride_id": ride_id, "reviewee_id": d_user_id, "score": 5}, headers=p_headers)

        # 2nd rating attempt
        resp = client.post("/api/v1/ratings", json={"ride_id": ride_id, "reviewee_id": d_user_id, "score": 4}, headers=p_headers)
        assert resp.status_code == 409
        assert "[RATING_005]" in resp.json()["message"]

    def test_self_rating_fails(self, client, rating_setup):
        d_headers, _, _, ride_id, d_user_id, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        resp = client.post("/api/v1/ratings", json={"ride_id": ride_id, "reviewee_id": d_user_id, "score": 5}, headers=d_headers)
        assert resp.status_code == 400
        assert "[RATING_002]" in resp.json()["message"]

    def test_non_participant_rating_fails(self, client, rating_setup):
        d_headers, _, o_headers, ride_id, d_user_id, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        resp = client.post("/api/v1/ratings", json={"ride_id": ride_id, "reviewee_id": d_user_id, "score": 5}, headers=o_headers)
        assert resp.status_code == 403
        assert "[RATING_004]" in resp.json()["message"]

    def test_get_public_user_ratings(self, client, rating_setup):
        d_headers, p_headers, _, ride_id, d_user_id, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)
        client.post("/api/v1/ratings", json={"ride_id": ride_id, "reviewee_id": d_user_id, "score": 5, "review": "Great commute!"}, headers=p_headers)

        resp = client.get(f"/api/v1/users/{d_user_id}/ratings")
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["average_rating"] == 5.0
        assert body["total_ratings"] == 1
        assert len(body["recent_reviews"]) == 1


# ------------------------------------------------------------------ #
#  Dashboard & Profile Summary Tests                                 #
# ------------------------------------------------------------------ #

class TestDashboardModule:

    def test_get_dashboard_analytics(self, client, rating_setup):
        d_headers, p_headers, _, ride_id, _, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        # Driver dashboard
        d_dash = client.get("/api/v1/dashboard", headers=d_headers)
        assert d_dash.status_code == 200
        d_body = d_dash.json()["data"]
        assert d_body["driver_stats"]["completed_rides"] == 1
        assert d_body["driver_stats"]["passenger_count"] == 1

        # Passenger dashboard
        p_dash = client.get("/api/v1/dashboard", headers=p_headers)
        assert p_dash.status_code == 200
        p_body = p_dash.json()["data"]
        assert p_body["passenger_stats"]["completed_trips"] == 1

    def test_get_profile_summary(self, client, rating_setup):
        d_headers, _, _, ride_id, _, _ = rating_setup
        client.patch(f"/api/v1/rides/{ride_id}/complete", headers=d_headers)

        resp = client.get("/api/v1/profile/summary", headers=d_headers)
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["completed_rides"] == 1
        assert "statistics" in body
