from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from uuid import uuid4
from pydantic import BaseModel, Field


class WSEventType(str, Enum):
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    HEARTBEAT = "heartbeat"
    JOIN_ROOM = "join_room"
    LEAVE_ROOM = "leave_room"
    RIDE_UPDATE = "ride_update"
    CHAT_JOIN = "chat_join"
    CHAT_LEAVE = "chat_leave"
    MESSAGE_SEND = "message_send"
    MESSAGE_RECEIVED = "message_received"
    MESSAGE_EDIT = "message_edit"
    MESSAGE_DELETE = "message_delete"
    MESSAGE_READ = "message_read"
    TYPING_START = "typing_start"
    TYPING_STOP = "typing_stop"
    ROOM_CREATED = "room_created"
    ROOM_UPDATED = "room_updated"
    BOOKING_REQUESTED = "booking_requested"
    BOOKING_ACCEPTED = "booking_accepted"
    BOOKING_REJECTED = "booking_rejected"
    BOOKING_CANCELLED = "booking_cancelled"
    RIDE_TRACKING_START = "ride_tracking_start"
    LOCATION_UPDATED = "location_updated"
    ETA_UPDATED = "eta_updated"
    ROUTE_UPDATED = "route_updated"
    DRIVER_STOPPED = "driver_stopped"
    PASSENGER_PICKED_UP = "passenger_picked_up"
    RIDE_STARTED = "ride_started"
    RIDE_PAUSED = "ride_paused"
    RIDE_RESUMED = "ride_resumed"
    RIDE_COMPLETED = "ride_completed"
    TRACKING_STOPPED = "tracking_stopped"
    NOTIFICATION_CREATED = "notification_created"
    NOTIFICATION_UPDATED = "notification_updated"
    NOTIFICATION_READ = "notification_read"
    NOTIFICATION_DELETED = "notification_deleted"
    NOTIFICATION_SYNC = "notification_sync"
    CHAT_PLACEHOLDER = "chat_placeholder"
    NOTIFICATION_PLACEHOLDER = "notification_placeholder"
    ERROR = "error"
    ACK = "ack"


class WSSender(BaseModel):
    user_id: str
    role: str = "passenger"


class WSEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: Dict[str, Any] = Field(default_factory=dict)
    sender: Optional[WSSender] = None
    room_id: Optional[str] = None


class WSErrorPayload(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class WSStatsResponse(BaseModel):
    active_connections: int
    connected_drivers: int
    connected_passengers: int
    room_count: int
    redis_connected: bool
    reconnect_count: int
