# Import all database models to register metadata for Alembic migrations
from app.db.base_class import Base  # noqa
from app.models.user import User, DriverProfile, PassengerProfile  # noqa
from app.models.token import RefreshToken  # noqa
from app.models.vehicle import Vehicle  # noqa
from app.models.ride import Ride  # noqa
from app.models.booking import RideRequest, Booking  # noqa
from app.models.chat import ChatRoom, ChatMessage, MessageReadStatus  # noqa
from app.models.notification import (  # noqa
    Notification,
    NotificationPreference,
    PushSubscription,
    NotificationDeliveryLog,
)
from app.models.rating import Rating  # noqa
from app.models.audit import AuditLog  # noqa
from app.models.location import DriverLocation  # noqa
from app.models.tracking import RideTrackingSession  # noqa




