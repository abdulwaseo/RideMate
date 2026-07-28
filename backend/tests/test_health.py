def test_health_check_endpoint(client):
    """Verify that GET /api/v1/health returns status 200 and success payloads."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Application health is stable"
    assert "data" in payload
    assert payload["data"]["status"] == "healthy"
    assert "app_name" in payload["data"]


def test_root_endpoint(client):
    """Verify that GET / returns status 200 and basic API status."""
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload == {"status": "ok", "message": "RideMate API is running"}

