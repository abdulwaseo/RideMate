"""
Integration tests for Production Hardening & Release Candidate (Sprint 8H).
"""
import pytest
from app.core.validators import (
    validate_cnic_number,
    validate_pakistani_mobile,
    validate_strong_password,
)
from app.schemas.pagination import PaginatedResponse


def test_health_check_endpoint(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["status"] == "healthy"
    assert body["data"]["database"] == "connected"


def test_liveness_probe(client):
    resp = client.get("/api/v1/health/liveness")
    assert resp.status_code == 200
    assert resp.json()["status"] == "alive"


def test_readiness_probe(client):
    resp = client.get("/api/v1/health/readiness")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"


def test_security_headers_and_request_id(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200

    # Verify security headers
    assert "x-request-id" in resp.headers
    assert "x-process-time" in resp.headers
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["x-frame-options"] == "DENY"
    assert "default-src 'self'" in resp.headers["content-security-policy"]


def test_mobile_validator():
    assert validate_pakistani_mobile("03001234567") == "+923001234567"
    assert validate_pakistani_mobile("+923001234567") == "+923001234567"
    with pytest.raises(ValueError):
        validate_pakistani_mobile("12345")


def test_cnic_validator():
    assert validate_cnic_number("4210112345671") == "42101-1234567-1"
    assert validate_cnic_number("42101-1234567-1") == "42101-1234567-1"
    with pytest.raises(ValueError):
        validate_cnic_number("123")


def test_password_validator():
    assert validate_strong_password("Str0ng@Pass!") == "Str0ng@Pass!"
    with pytest.raises(ValueError):
        validate_strong_password("weak")


def test_paginated_response_utility():
    items = ["item1", "item2", "item3"]
    paginated = PaginatedResponse.create(items=items, total=25, page=1, page_size=10)
    assert paginated.total == 25
    assert paginated.page == 1
    assert paginated.page_size == 10
    assert paginated.total_pages == 3
