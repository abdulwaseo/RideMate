from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    drivers,
    vehicles,
    rides,
    booking,
    chat,
    notifications,
    ratings,
    users,
    dashboard,
    profile,
    location,
    tracking,
)

# version 1 route registry
api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["Health"])

# Authentication & Identity
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Driver Profile
api_router.include_router(drivers.router, prefix="/drivers", tags=["Driver Profile"])

# Vehicles Garage
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])

# Ride Management
api_router.include_router(rides.router, prefix="/rides", tags=["Ride Management"])

# Ride Requests & Booking Engine
api_router.include_router(booking.requests_router, prefix="/ride-requests", tags=["Ride Requests"])
api_router.include_router(booking.driver_requests_router, prefix="/drivers", tags=["Driver Request Management"])
api_router.include_router(booking.bookings_router, prefix="/bookings", tags=["Passenger Bookings"])

# Temporary Ride Chat
api_router.include_router(chat.router, prefix="/chat", tags=["Ride Chat"])

# In-App Notifications
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Ratings & Reviews
api_router.include_router(ratings.router, prefix="/ratings", tags=["Ratings & Reviews"])

# Public User Profiles & Reputation
api_router.include_router(users.router, prefix="/users", tags=["Public User Profiles"])

# User Analytics & Dashboard
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard & Analytics"])

# Profile Summary
api_router.include_router(profile.router, prefix="/profile", tags=["Profile Summary"])

# Live GPS Telemetry & Location
api_router.include_router(location.router, prefix="/location", tags=["Live GPS Telemetry & Location"])

# WebSocket Real-Time Foundation
from app.api.v1.endpoints import websocket
api_router.include_router(websocket.router, tags=["WebSocket Real-Time Infrastructure"])

# Real-Time Ride Tracking & ETA
api_router.include_router(tracking.router, prefix="/tracking", tags=["Real-Time Ride Tracking"])



