from enum import Enum

class UserRole(str, Enum):
    PASSENGER = "passenger"
    DRIVER = "driver"
    ADMIN = "admin"

class RideStatus(str, Enum):
    UPCOMING = "Upcoming"
    ACTIVE = "Active"
    FULL = "Full"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class BookingStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"

class VerificationStatus(str, Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"

class VehicleType(str, Enum):
    CAR = "Car"
    BIKE = "Bike"

class ConfirmedBookingStatus(str, Enum):
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"

class MessageType(str, Enum):
    TEXT = "TEXT"
    SYSTEM = "SYSTEM"
    RIDE_UPDATE = "RIDE_UPDATE"
    IMAGE = "IMAGE"
    FILE = "FILE"
    LOCATION = "LOCATION"

class NotificationCategory(str, Enum):
    RIDE = "Ride"
    BOOKING = "Booking"
    CHAT = "Chat"
    DRIVER = "Driver"
    PASSENGER = "Passenger"
    SYSTEM = "System"
    SECURITY = "Security"
    PROMOTION = "Promotion"
    GENERAL = "General"

class NotificationPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TrackingStatus(str, Enum):
    PREPARING = "Preparing"
    DRIVER_EN_ROUTE = "DriverEnRoute"
    PASSENGER_PICKUP = "PassengerPickup"
    RIDE_IN_PROGRESS = "RideInProgress"
    DESTINATION_APPROACHING = "DestinationApproaching"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


