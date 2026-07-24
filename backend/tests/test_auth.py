"""
Authentication endpoint integration tests.

Uses the shared SQLite test database fixture from conftest.py.
"""
import pytest
from app.schemas.enums import UserRole, VerificationStatus

VALID_USER = {
    "name": "Abdul Waseo",
    "mobile_number": "+923001234567",
    "password": "Str0ng@Pass!",
    "office_name": "Dilkusha Towers",
}


# ------------------------------------------------------------------ #
#  Register tests                                                      #
# ------------------------------------------------------------------ #

class TestRegister:

    def test_register_success(self, client):
        resp = client.post("/api/v1/auth/register", json=VALID_USER)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        assert "access_token" in body["data"]["tokens"]
        assert "refresh_token" in body["data"]["tokens"]
        assert body["data"]["user"]["mobile_number"] == VALID_USER["mobile_number"]
        assert body["data"]["user"]["name"] == VALID_USER["name"]
        # Default role must be passenger
        assert body["data"]["user"]["role"] == UserRole.PASSENGER.value
        # Password hash must never be exposed
        assert "hashed_password" not in str(body)

    def test_register_duplicate_mobile(self, client):
        # Register first user
        client.post("/api/v1/auth/register", json=VALID_USER)
        # Attempt duplicate registration
        resp = client.post("/api/v1/auth/register", json=VALID_USER)
        assert resp.status_code == 409
        assert resp.json()["success"] is False

    def test_register_invalid_mobile(self, client):
        bad = {**VALID_USER, "mobile_number": "12345678"}
        resp = client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422

    def test_register_weak_password_no_uppercase(self, client):
        bad = {**VALID_USER, "mobile_number": "+923009999991", "password": "weakpass1!"}
        resp = client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422

    def test_register_weak_password_no_digit(self, client):
        bad = {**VALID_USER, "mobile_number": "+923009999992", "password": "WeakPass!!"}
        resp = client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422

    def test_register_weak_password_no_special(self, client):
        bad = {**VALID_USER, "mobile_number": "+923009999993", "password": "WeakPass1"}
        resp = client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422

    def test_register_passenger_profile_created(self, client):
        new_user = {**VALID_USER, "mobile_number": "+923001111111", "name": "Test User 2"}
        resp = client.post("/api/v1/auth/register", json=new_user)
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["user"]["passenger_profile"] is not None
        assert data["user"]["driver_profile"] is None


# ------------------------------------------------------------------ #
#  Login tests                                                         #
# ------------------------------------------------------------------ #

class TestLogin:

    def test_login_success(self, client):
        # Register user
        client.post("/api/v1/auth/register", json=VALID_USER)

        resp = client.post("/api/v1/auth/login", json={
            "mobile_number": VALID_USER["mobile_number"],
            "password": VALID_USER["password"],
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "access_token" in body["data"]["tokens"]

    def test_login_wrong_password(self, client):
        client.post("/api/v1/auth/register", json=VALID_USER)

        resp = client.post("/api/v1/auth/login", json={
            "mobile_number": VALID_USER["mobile_number"],
            "password": "WrongPass99!",
        })
        assert resp.status_code == 401

    def test_login_unregistered_mobile(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "mobile_number": "+923007777777",
            "password": VALID_USER["password"],
        })
        assert resp.status_code == 401

    def test_login_invalid_mobile_format(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "mobile_number": "not-a-number",
            "password": VALID_USER["password"],
        })
        assert resp.status_code == 422


# ------------------------------------------------------------------ #
#  Refresh tests                                                       #
# ------------------------------------------------------------------ #

class TestRefresh:

    def test_refresh_success(self, client):
        # Register
        reg_resp = client.post("/api/v1/auth/register", json=VALID_USER)
        tokens = reg_resp.json()["data"]["tokens"]

        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": tokens["refresh_token"],
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "access_token" in body["data"]["tokens"]
        # Token rotation: new refresh token is returned
        assert body["data"]["tokens"]["refresh_token"] != tokens["refresh_token"]

    def test_refresh_invalid_token(self, client):
        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "totally.invalid.token",
        })
        assert resp.status_code == 401

    def test_refresh_revoked_token(self, client):
        reg_resp = client.post("/api/v1/auth/register", json=VALID_USER)
        tokens = reg_resp.json()["data"]["tokens"]

        # First refresh (revokes tokens["refresh_token"])
        client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})

        # Second refresh using old token (should fail)
        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert resp.status_code == 401


# ------------------------------------------------------------------ #
#  Logout tests                                                        #
# ------------------------------------------------------------------ #

class TestLogout:

    def test_logout_success(self, client):
        reg_resp = client.post("/api/v1/auth/register", json={
            **VALID_USER,
            "mobile_number": "+923002222222",
        })
        tokens = reg_resp.json()["data"]["tokens"]

        resp = client.post("/api/v1/auth/logout", json={
            "refresh_token": tokens["refresh_token"],
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_logout_idempotent(self, client):
        reg_resp = client.post("/api/v1/auth/register", json={
            **VALID_USER,
            "mobile_number": "+923002222222",
        })
        tokens = reg_resp.json()["data"]["tokens"]

        client.post("/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]})
        # Second call succeeds silently
        resp = client.post("/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]})
        assert resp.status_code == 200

    def test_refresh_after_logout_fails(self, client):
        reg_resp = client.post("/api/v1/auth/register", json={
            **VALID_USER,
            "mobile_number": "+923002222222",
        })
        tokens = reg_resp.json()["data"]["tokens"]

        client.post("/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]})

        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert resp.status_code == 401


# ------------------------------------------------------------------ #
#  Current User (/me) tests                                            #
# ------------------------------------------------------------------ #

class TestGetMe:

    def test_get_me_success(self, client):
        reg_resp = client.post("/api/v1/auth/register", json=VALID_USER)
        access_token = reg_resp.json()["data"]["tokens"]["access_token"]

        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["mobile_number"] == VALID_USER["mobile_number"]
        assert body["data"]["name"] == VALID_USER["name"]

    def test_get_me_no_token(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_get_me_invalid_token(self, client):
        resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bad.token.here"})
        assert resp.status_code == 401
