# 🗺️ RideMate Live GPS Telemetry & Maps Architecture (Sprint 9C)

This document details the decoupled **Live Location & GPS Tracking Architecture**, **Permission Lifecycle**, and **Future WebSocket Migration Strategy** for RideMate.

---

## 🏛️ Layered Telemetry Architecture

UI components **never** interact directly with browser `navigator.geolocation` or WebSocket connections. All location state flows through dedicated services:

```text
React Tracking UI (ActiveRide / MapsDemoPage / TrackingStatus)
                             ↓
             MapContext / Provider (autoFollow, driverLocation)
                             ↓
             TrackingService (Movement Filter: 5m threshold)
             ┌───────────────┴───────────────┐
             ↓                               ↓
      LocationService               LocationSyncService
  (Geolocation API Wrapper)        (Transport Abstraction Layer)
                                             ↓
                                    Backend Location API
```

---

## 📡 Live Location API Endpoints (Sprint 9C)

| Method | Endpoint | Access Rule | Description |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1/location/update` | Driver Only | Publishes driver `latitude`, `longitude`, `heading`, `speed`, `accuracy`, and `ride_id`. |
| **`GET`** | `/api/v1/location/current` | Driver Only | Fetches driver's own last recorded GPS location. |
| **`GET`** | `/api/v1/location/ride/{ride_id}` | Driver & Accepted Passengers | Fetches driver location for an active ride. Rejected for unbooked passengers (`[BOOKING_004]`). |
| **`DELETE`** | `/api/v1/location/stop` | Driver Only | Stops live GPS tracking and purges active telemetry record. |

---

## ⚡ Future WebSocket Migration Strategy (Phase 2)

The `LocationSyncService` acts as an isolated transport provider:

1. **Current Polling Implementation**:
   - `LocationSyncService.updateLocation()` makes `POST /api/v1/location/update`.
   - `TrackingService.startPassengerTracking()` polls `GET /api/v1/location/ride/{ride_id}` every 3000ms.

2. **Phase 2 WebSocket Upgrade**:
   - Update `LocationSyncService` internally to connect to `ws://localhost:8000/api/v1/ws/location`.
   - `updateLocation()` emits `location_update` frame over socket.
   - `fetchRideLocation()` subscribes to socket topic `ride_{ride_id}_location`.
   - **Zero changes required** in `TrackingService`, `MapContext`, `DriverLocationMarker`, or any React page components.

---

## 🔐 Security & Permission Rules

- **Driver Authorization**: Only users with an active `DriverProfile` can post telemetry (`[DRIVER_004]`).
- **Passenger Access Restriction**: Passengers can query ride telemetry **only** if they hold a `CONFIRMED` booking or `ACCEPTED` ride request.
- **Ride Status Enforcement**: Location updates are automatically blocked for `COMPLETED` or `CANCELLED` rides.
