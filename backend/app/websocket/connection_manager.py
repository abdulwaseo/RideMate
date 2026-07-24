import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple
from uuid import uuid4
from fastapi import WebSocket, status
from loguru import logger

from app.core.config import settings
from app.models.user import User
from app.schemas.websocket import WSEvent, WSEventType
from app.websocket.redis_bus import redis_bus


class ConnectionManager:
    """
    Enterprise WebSocket connection manager managing active socket instances, room subscriptions,
    heartbeats, connection limits, and message broadcasting via Redis Pub/Sub.
    """

    def __init__(self):
        # connection_id -> WebSocket instance
        self.active_connections: Dict[str, WebSocket] = {}

        # connection_id -> user_id (str)
        self.connection_user_map: Dict[str, str] = {}

        # user_id (str) -> Set[connection_id]
        self.user_connections_map: Dict[str, Set[str]] = {}

        # connection_id -> role (str)
        self.connection_role_map: Dict[str, str] = {}

        # room_id (str) -> Set[connection_id]
        self.rooms: Dict[str, Set[str]] = {}

        # connection_id -> Set[room_id]
        self.connection_rooms_map: Dict[str, Set[str]] = {}

        # connection_id -> last_heartbeat (timestamp float)
        self.last_heartbeat: Dict[str, float] = {}

        # Metrics tracking
        self.reconnect_count: int = 0

    async def connect(self, websocket: WebSocket, user: User) -> Tuple[str, bool]:
        """
        Accepts WebSocket connection, assigns connection ID, enforces per-user limit,
        and registers automatic user & global rooms.
        Returns (connection_id, is_reconnect).
        """
        user_id_str = str(user.id)
        user_role = "driver" if user.driver_profile else "passenger"

        # Enforce max connection limit per user
        current_conns = self.user_connections_map.get(user_id_str, set())
        if len(current_conns) >= settings.WS_MAX_CONNECTIONS_PER_USER:
            logger.warning(f"User {user_id_str} exceeded max connection limit ({settings.WS_MAX_CONNECTIONS_PER_USER}).")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Max connection limit reached")
            return "", False

        await websocket.accept()

        connection_id = f"conn_{uuid4().hex[:12]}"
        is_reconnect = len(current_conns) > 0
        if is_reconnect:
            self.reconnect_count += 1

        self.active_connections[connection_id] = websocket
        self.connection_user_map[connection_id] = user_id_str
        self.connection_role_map[connection_id] = user_role
        self.last_heartbeat[connection_id] = datetime.now(timezone.utc).timestamp()

        if user_id_str not in self.user_connections_map:
            self.user_connections_map[user_id_str] = set()
        self.user_connections_map[user_id_str].add(connection_id)

        # Auto-join core rooms
        await self.join_room(connection_id, "global")
        await self.join_room(connection_id, f"user:{user_id_str}")
        if user_role == "driver":
            await self.join_room(connection_id, f"driver:{user_id_str}")
        else:
            await self.join_room(connection_id, f"passenger:{user_id_str}")

        logger.info(f"WebSocket connected: {connection_id} (User: {user_id_str}, Role: {user_role})")
        return connection_id, is_reconnect

    async def disconnect(self, connection_id: str, reason: str = "Client disconnected") -> None:
        """Cleanly removes connection, leaves all subscribed rooms, and updates user state."""
        if connection_id not in self.active_connections:
            return

        websocket = self.active_connections.pop(connection_id, None)
        user_id_str = self.connection_user_map.pop(connection_id, None)
        self.connection_role_map.pop(connection_id, None)
        self.last_heartbeat.pop(connection_id, None)

        if user_id_str and user_id_str in self.user_connections_map:
            self.user_connections_map[user_id_str].discard(connection_id)
            if not self.user_connections_map[user_id_str]:
                self.user_connections_map.pop(user_id_str, None)

        # Leave all rooms
        joined_rooms = list(self.connection_rooms_map.pop(connection_id, set()))
        for room_id in joined_rooms:
            await self.leave_room(connection_id, room_id, notify=False)

        if websocket:
            try:
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE, reason=reason)
            except Exception:
                pass

        logger.info(f"WebSocket disconnected: {connection_id} (User: {user_id_str}, Reason: {reason})")

    def register_heartbeat(self, connection_id: str) -> None:
        """Updates last heartbeat timestamp for a connection."""
        if connection_id in self.active_connections:
            self.last_heartbeat[connection_id] = datetime.now(timezone.utc).timestamp()

    async def join_room(self, connection_id: str, room_id: str) -> bool:
        """Subscribes connection to room. Dynamically creates room if not existing."""
        if connection_id not in self.active_connections:
            return False

        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            # Subscribe Redis bus to room channel for multi-instance forwarding
            await redis_bus.subscribe(
                f"ws_room:{room_id}",
                lambda msg, r_id=room_id: asyncio.create_task(self._handle_redis_room_message(r_id, msg)),
            )

        self.rooms[room_id].add(connection_id)

        if connection_id not in self.connection_rooms_map:
            self.connection_rooms_map[connection_id] = set()
        self.connection_rooms_map[connection_id].add(room_id)

        logger.debug(f"Connection {connection_id} joined room {room_id}")
        return True

    async def leave_room(self, connection_id: str, room_id: str, notify: bool = True) -> bool:
        """Unsubscribes connection from room. Auto-destroys empty rooms."""
        if room_id in self.rooms:
            self.rooms[room_id].discard(connection_id)
            if not self.rooms[room_id]:
                self.rooms.pop(room_id, None)

        if connection_id in self.connection_rooms_map:
            self.connection_rooms_map[connection_id].discard(room_id)

        logger.debug(f"Connection {connection_id} left room {room_id}")
        return True

    async def send_personal_event(self, connection_id: str, event: WSEvent) -> bool:
        """Sends a JSON event frame directly to a single socket connection."""
        websocket = self.active_connections.get(connection_id)
        if not websocket:
            return False

        try:
            await websocket.send_text(event.model_dump_json())
            return True
        except Exception as e:
            logger.error(f"Error sending personal message to {connection_id}: {e}")
            await self.disconnect(connection_id, reason="Send error")
            return False

    async def send_user_event(self, user_id: str, event: WSEvent) -> int:
        """Sends an event frame to all active connections belonging to a user."""
        conns = self.user_connections_map.get(user_id, set())
        sent_count = 0
        for conn_id in list(conns):
            if await self.send_personal_event(conn_id, event):
                sent_count += 1
        return sent_count

    async def broadcast_to_room(
        self, room_id: str, event: WSEvent, exclude_connection_id: Optional[str] = None
    ) -> int:
        """
        Broadcasts an event frame to all subscribers in a room.
        Publishes message to Redis Pub/Sub channel `ws_room:<room_id>`.
        """
        event.room_id = room_id
        msg_str = event.model_dump_json()

        # Publish via Redis Pub/Sub (which forwards to local sockets + other instances)
        await redis_bus.publish(f"ws_room:{room_id}", msg_str)

        # Direct local broadcast for minimum latency
        return await self._dispatch_local_room_message(room_id, msg_str, exclude_connection_id)

    async def _handle_redis_room_message(self, room_id: str, message_str: str) -> None:
        """Callback handling incoming messages from Redis Pub/Sub."""
        await self._dispatch_local_room_message(room_id, message_str)

    async def _dispatch_local_room_message(
        self, room_id: str, message_str: str, exclude_connection_id: Optional[str] = None
    ) -> int:
        """Sends raw message to all local socket connections subscribed to room_id."""
        conns = self.rooms.get(room_id, set())
        sent_count = 0
        for conn_id in list(conns):
            if exclude_connection_id and conn_id == exclude_connection_id:
                continue
            websocket = self.active_connections.get(conn_id)
            if websocket:
                try:
                    await websocket.send_text(message_str)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed room broadcast to {conn_id}: {e}")
                    await self.disconnect(conn_id, reason="Room broadcast error")
        return sent_count

    async def clean_stale_connections(self, max_inactive_seconds: int = 45) -> int:
        """Scans and disconnects connections that haven't sent a heartbeat within max_inactive_seconds."""
        now = datetime.now(timezone.utc).timestamp()
        stale_ids = []

        for conn_id, last_ts in self.last_heartbeat.items():
            if now - last_ts > max_inactive_seconds:
                stale_ids.append(conn_id)

        for conn_id in stale_ids:
            logger.warning(f"Disconnecting stale connection: {conn_id} (Inactive > {max_inactive_seconds}s)")
            await self.disconnect(conn_id, reason="Heartbeat timeout")

        return len(stale_ids)

    def get_stats(self) -> Dict:
        """Returns statistics snapshot for real-time monitoring."""
        connected_drivers = sum(1 for r in self.connection_role_map.values() if r == "driver")
        connected_passengers = sum(1 for r in self.connection_role_map.values() if r == "passenger")

        return {
            "active_connections": len(self.active_connections),
            "connected_drivers": connected_drivers,
            "connected_passengers": connected_passengers,
            "room_count": len(self.rooms),
            "redis_connected": redis_bus.is_connected,
            "reconnect_count": self.reconnect_count,
        }


# Global singleton instance for connection manager
manager = ConnectionManager()
