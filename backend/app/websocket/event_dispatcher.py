import json
from datetime import datetime, timezone
from typing import Dict, Any
from uuid import UUID
from pydantic import ValidationError
from loguru import logger

from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.websocket import WSEvent, WSEventType, WSSender
from app.services.chat import ChatService
from app.websocket.connection_manager import manager


class EventDispatcher:
    """
    Decoupled event dispatcher routing raw WebSocket JSON frames to event handlers.
    Strictly keeps business logic out of API route handlers.
    """

    @classmethod
    async def dispatch(cls, connection_id: str, user: User, raw_text: str) -> None:
        """Parses incoming WebSocket text message and routes to target event handler."""
        try:
            data = json.loads(raw_text)
            event = WSEvent.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning(f"Malformed WebSocket payload from {connection_id}: {e}")
            error_event = WSEvent(
                event_type=WSEventType.ERROR.value,
                payload={"code": "MALFORMED_PAYLOAD", "message": "Invalid JSON or event schema mismatch."},
            )
            await manager.send_personal_event(connection_id, error_event)
            return

        user_id_str = str(user.id)
        user_role = "driver" if user.driver_profile else "passenger"
        event.sender = WSSender(user_id=user_id_str, role=user_role)

        event_type = event.event_type

        # Dispatch by event type
        if event_type == WSEventType.HEARTBEAT.value:
            await cls._handle_heartbeat(connection_id, event)
        elif event_type == WSEventType.JOIN_ROOM.value:
            await cls._handle_join_room(connection_id, user, event)
        elif event_type == WSEventType.LEAVE_ROOM.value:
            await cls._handle_leave_room(connection_id, event)
        elif event_type == WSEventType.CHAT_JOIN.value:
            await cls._handle_chat_join(connection_id, user, event)
        elif event_type == WSEventType.CHAT_LEAVE.value:
            await cls._handle_chat_leave(connection_id, event)
        elif event_type == WSEventType.MESSAGE_SEND.value:
            await cls._handle_message_send(connection_id, user, event)
        elif event_type == WSEventType.MESSAGE_EDIT.value:
            await cls._handle_message_edit(connection_id, user, event)
        elif event_type == WSEventType.MESSAGE_DELETE.value:
            await cls._handle_message_delete(connection_id, user, event)
        elif event_type == WSEventType.MESSAGE_READ.value:
            await cls._handle_message_read(connection_id, user, event)
        elif event_type in (WSEventType.TYPING_START.value, WSEventType.TYPING_STOP.value):
            await cls._handle_typing_status(connection_id, user, event)
        elif event_type == WSEventType.RIDE_UPDATE.value:
            await cls._handle_ride_update(connection_id, user, event)
        elif event_type == WSEventType.RIDE_TRACKING_START.value:
            await cls._handle_tracking_start(connection_id, user, event)
        elif event_type == WSEventType.LOCATION_UPDATED.value:
            await cls._handle_location_updated(connection_id, user, event)
        elif event_type == WSEventType.TRACKING_STOPPED.value:
            await cls._handle_tracking_stopped(connection_id, user, event)
        elif event_type in (
            WSEventType.DRIVER_STOPPED.value,
            WSEventType.PASSENGER_PICKED_UP.value,
            WSEventType.RIDE_STARTED.value,
            WSEventType.RIDE_PAUSED.value,
            WSEventType.RIDE_RESUMED.value,
            WSEventType.RIDE_COMPLETED.value,
        ):
            await cls._handle_tracking_phase_change(connection_id, user, event)
        elif event_type in (
            WSEventType.NOTIFICATION_READ.value,
            WSEventType.NOTIFICATION_DELETED.value,
            WSEventType.NOTIFICATION_SYNC.value,
        ):
            await cls._handle_notification_event(connection_id, user, event)
        else:
            if event.room_id:
                await manager.broadcast_to_room(event.room_id, event, exclude_connection_id=connection_id)
            else:
                ack_event = WSEvent(
                    event_type=WSEventType.ACK.value,
                    payload={"event_id": event.event_id, "status": "processed"},
                )
                await manager.send_personal_event(connection_id, ack_event)

    @classmethod
    async def _handle_heartbeat(cls, connection_id: str, event: WSEvent) -> None:
        manager.register_heartbeat(connection_id)
        pong_event = WSEvent(
            event_id=event.event_id,
            event_type=WSEventType.HEARTBEAT.value,
            payload={"type": "pong", "server_time": datetime.now(timezone.utc).isoformat()},
        )
        await manager.send_personal_event(connection_id, pong_event)

    @classmethod
    async def _handle_join_room(cls, connection_id: str, user: User, event: WSEvent) -> None:
        room_id = event.payload.get("room_id") or event.room_id
        if not room_id:
            await manager.send_personal_event(
                connection_id,
                WSEvent(
                    event_type=WSEventType.ERROR.value,
                    payload={"code": "MISSING_ROOM_ID", "message": "room_id is required."},
                ),
            )
            return

        if room_id.startswith("user:") and room_id != f"user:{user.id}":
            await manager.send_personal_event(
                connection_id,
                WSEvent(
                    event_type=WSEventType.ERROR.value,
                    payload={"code": "UNAUTHORIZED_ROOM", "message": "Cannot join another user's room."},
                ),
            )
            return

        await manager.join_room(connection_id, room_id)
        await manager.send_personal_event(
            connection_id,
            WSEvent(
                event_id=event.event_id,
                event_type=WSEventType.ACK.value,
                payload={"action": "join_room", "room_id": room_id, "status": "success"},
            ),
        )

    @classmethod
    async def _handle_leave_room(cls, connection_id: str, event: WSEvent) -> None:
        room_id = event.payload.get("room_id") or event.room_id
        if room_id:
            await manager.leave_room(connection_id, room_id)
            await manager.send_personal_event(
                connection_id,
                WSEvent(
                    event_id=event.event_id,
                    event_type=WSEventType.ACK.value,
                    payload={"action": "leave_room", "room_id": room_id, "status": "success"},
                ),
            )

    @classmethod
    async def _handle_chat_join(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Joins chat room channel chat:<room_id> after verifying participant access."""
        room_id_str = event.payload.get("room_id") or event.room_id
        if not room_id_str:
            return

        db = SessionLocal()
        try:
            svc = ChatService(db)
            try:
                room_uuid = UUID(room_id_str.replace("chat:", ""))
                svc.get_room_detail(user, room_uuid)
            except Exception as ex:
                await manager.send_personal_event(
                    connection_id,
                    WSEvent(
                        event_type=WSEventType.ERROR.value,
                        payload={"code": "UNAUTHORIZED_CHAT_ROOM", "message": str(ex)},
                    ),
                )
                return
        finally:
            db.close()

        channel_id = room_id_str if room_id_str.startswith("chat:") else f"chat:{room_id_str}"
        await manager.join_room(connection_id, channel_id)

        await manager.send_personal_event(
            connection_id,
            WSEvent(
                event_id=event.event_id,
                event_type=WSEventType.CHAT_JOIN.value,
                payload={"room_id": channel_id, "status": "joined"},
            ),
        )

    @classmethod
    async def _handle_chat_leave(cls, connection_id: str, event: WSEvent) -> None:
        room_id_str = event.payload.get("room_id") or event.room_id
        if room_id_str:
            channel_id = room_id_str if room_id_str.startswith("chat:") else f"chat:{room_id_str}"
            await manager.leave_room(connection_id, channel_id)

    @classmethod
    async def _handle_message_send(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Persists chat message in DB and broadcasts MESSAGE_RECEIVED frame to room."""
        room_id_str = event.payload.get("room_id") or event.room_id
        content = event.payload.get("content", "")
        reply_to_id = event.payload.get("reply_to_message_id")

        if not room_id_str or not content:
            return

        db = SessionLocal()
        try:
            svc = ChatService(db)
            room_uuid = UUID(room_id_str.replace("chat:", ""))
            reply_uuid = UUID(reply_to_id) if reply_to_id else None

            msg_res = svc.post_message(
                user=user,
                room_id=room_uuid,
                content=content,
                reply_to_message_id=reply_uuid,
            )

            channel_id = f"chat:{room_uuid}"
            broadcast_event = WSEvent(
                event_type=WSEventType.MESSAGE_RECEIVED.value,
                room_id=channel_id,
                payload=msg_res.model_dump(mode="json"),
            )

            await manager.broadcast_to_room(channel_id, broadcast_event)
        except Exception as e:
            logger.error(f"Error handling message_send on {connection_id}: {e}")
            await manager.send_personal_event(
                connection_id,
                WSEvent(
                    event_type=WSEventType.ERROR.value,
                    payload={"code": "MESSAGE_SEND_FAILED", "message": str(e)},
                ),
            )
        finally:
            db.close()

    @classmethod
    async def _handle_message_edit(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Edits message and broadcasts MESSAGE_EDIT event frame to room."""
        room_id_str = event.payload.get("room_id") or event.room_id
        message_id_str = event.payload.get("message_id")
        new_content = event.payload.get("content")

        if not room_id_str or not message_id_str or not new_content:
            return

        db = SessionLocal()
        try:
            svc = ChatService(db)
            room_uuid = UUID(room_id_str.replace("chat:", ""))
            msg_uuid = UUID(message_id_str)

            updated = svc.edit_message(user, room_uuid, msg_uuid, new_content)
            channel_id = f"chat:{room_uuid}"

            broadcast_event = WSEvent(
                event_type=WSEventType.MESSAGE_EDIT.value,
                room_id=channel_id,
                payload=updated.model_dump(mode="json"),
            )
            await manager.broadcast_to_room(channel_id, broadcast_event)
        except Exception as e:
            logger.error(f"Error editing message on {connection_id}: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_message_delete(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Deletes message and broadcasts MESSAGE_DELETE event frame to room."""
        room_id_str = event.payload.get("room_id") or event.room_id
        message_id_str = event.payload.get("message_id")

        if not room_id_str or not message_id_str:
            return

        db = SessionLocal()
        try:
            svc = ChatService(db)
            room_uuid = UUID(room_id_str.replace("chat:", ""))
            msg_uuid = UUID(message_id_str)

            deleted = svc.delete_message(user, room_uuid, msg_uuid)
            channel_id = f"chat:{room_uuid}"

            broadcast_event = WSEvent(
                event_type=WSEventType.MESSAGE_DELETE.value,
                room_id=channel_id,
                payload=deleted.model_dump(mode="json"),
            )
            await manager.broadcast_to_room(channel_id, broadcast_event)
        except Exception as e:
            logger.error(f"Error deleting message on {connection_id}: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_message_read(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Marks messages read and broadcasts MESSAGE_READ status update frame."""
        room_id_str = event.payload.get("room_id") or event.room_id
        message_ids = event.payload.get("message_ids", [])

        if not room_id_str or not message_ids:
            return

        db = SessionLocal()
        try:
            svc = ChatService(db)
            room_uuid = UUID(room_id_str.replace("chat:", ""))
            msg_uuids = [UUID(m) for m in message_ids]

            count = svc.mark_messages_read(user, room_uuid, msg_uuids)
            if count > 0:
                channel_id = f"chat:{room_uuid}"
                broadcast_event = WSEvent(
                    event_type=WSEventType.MESSAGE_READ.value,
                    room_id=channel_id,
                    payload={"user_id": str(user.id), "message_ids": [str(m) for m in msg_uuids]},
                )
                await manager.broadcast_to_room(channel_id, broadcast_event)
        except Exception as e:
            logger.error(f"Error marking messages read: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_typing_status(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Broadcasts typing indicators to room."""
        room_id_str = event.payload.get("room_id") or event.room_id
        if not room_id_str:
            return

        channel_id = room_id_str if room_id_str.startswith("chat:") else f"chat:{room_id_str}"
        broadcast_event = WSEvent(
            event_type=event.event_type,
            room_id=channel_id,
            payload={
                "user_id": str(user.id),
                "user_name": user.name,
                "is_typing": event.event_type == WSEventType.TYPING_START.value,
            },
        )
        await manager.broadcast_to_room(channel_id, broadcast_event, exclude_connection_id=connection_id)

    @classmethod
    async def _handle_ride_update(cls, connection_id: str, user: User, event: WSEvent) -> None:
        room_id = event.room_id or event.payload.get("room_id")
        if room_id:
            await manager.broadcast_to_room(room_id, event, exclude_connection_id=connection_id)

    @classmethod
    async def _handle_tracking_start(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Driver starts a tracking session and announces to ride room."""
        ride_id_str = event.payload.get("ride_id") or event.room_id
        if not ride_id_str:
            return

        db = SessionLocal()
        try:
            from uuid import UUID as _UUID
            from app.services.ride_tracking_service import RideTrackingService
            svc = RideTrackingService(db)
            ride_id = _UUID(ride_id_str.replace("ride:", ""))
            _, start_payload = svc.start_tracking(user, ride_id)

            channel = f"ride:{ride_id}"
            await manager.join_room(connection_id, channel)

            broadcast = WSEvent(
                event_type=WSEventType.RIDE_TRACKING_START.value,
                room_id=channel,
                payload=start_payload.model_dump(mode="json"),
            )
            await manager.broadcast_to_room(channel, broadcast)
        except Exception as e:
            logger.error(f"tracking_start error on {connection_id}: {e}")
            await manager.send_personal_event(
                connection_id,
                WSEvent(event_type=WSEventType.ERROR.value, payload={"code": "TRACKING_START_FAILED", "message": str(e)}),
            )
        finally:
            db.close()

    @classmethod
    async def _handle_location_updated(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Driver sends a GPS fix — persist, recompute ETA, broadcast to ride room."""
        p = event.payload
        ride_id_str = p.get("ride_id") or event.room_id
        latitude = p.get("latitude")
        longitude = p.get("longitude")

        if not ride_id_str or latitude is None or longitude is None:
            return

        db = SessionLocal()
        try:
            from uuid import UUID as _UUID
            from app.services.ride_tracking_service import RideTrackingService
            svc = RideTrackingService(db)
            ride_id = _UUID(ride_id_str.replace("ride:", ""))

            loc_evt, eta_payload = svc.process_location_update(
                driver=user,
                ride_id=ride_id,
                latitude=float(latitude),
                longitude=float(longitude),
                heading=p.get("heading"),
                speed=p.get("speed"),
                accuracy=p.get("accuracy"),
            )

            channel = f"ride:{ride_id}"
            await manager.broadcast_to_room(
                channel,
                WSEvent(
                    event_type=WSEventType.LOCATION_UPDATED.value,
                    room_id=channel,
                    payload=loc_evt.model_dump(mode="json"),
                ),
            )
            await manager.broadcast_to_room(
                channel,
                WSEvent(
                    event_type=WSEventType.ETA_UPDATED.value,
                    room_id=channel,
                    payload=eta_payload.model_dump(mode="json"),
                ),
            )
        except Exception as e:
            logger.error(f"location_updated error on {connection_id}: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_tracking_stopped(cls, connection_id: str, user: User, event: WSEvent) -> None:
        """Driver stops tracking — close session, broadcast TRACKING_STOPPED."""
        ride_id_str = event.payload.get("ride_id") or event.room_id
        if not ride_id_str:
            return

        db = SessionLocal()
        try:
            from uuid import UUID as _UUID
            from app.services.ride_tracking_service import RideTrackingService
            svc = RideTrackingService(db)
            ride_id = _UUID(ride_id_str.replace("ride:", ""))
            svc.stop_tracking(user, ride_id)

            channel = f"ride:{ride_id}"
            await manager.broadcast_to_room(
                channel,
                WSEvent(
                    event_type=WSEventType.TRACKING_STOPPED.value,
                    room_id=channel,
                    payload={"ride_id": str(ride_id), "reason": "driver_stopped"},
                ),
            )
        except Exception as e:
            logger.error(f"tracking_stopped error on {connection_id}: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_tracking_phase_change(
        cls, connection_id: str, user: User, event: WSEvent
    ) -> None:
        """Driver advances ride phase (e.g. passenger_picked_up, ride_started)."""
        ride_id_str = event.payload.get("ride_id") or event.room_id
        if not ride_id_str:
            return

        db = SessionLocal()
        try:
            from uuid import UUID as _UUID
            from app.schemas.enums import TrackingStatus
            from app.services.ride_tracking_service import RideTrackingService

            phase_map = {
                WSEventType.RIDE_STARTED.value: TrackingStatus.RIDE_IN_PROGRESS,
                WSEventType.PASSENGER_PICKED_UP.value: TrackingStatus.PASSENGER_PICKUP,
                WSEventType.RIDE_PAUSED.value: TrackingStatus.RIDE_IN_PROGRESS,
                WSEventType.RIDE_RESUMED.value: TrackingStatus.RIDE_IN_PROGRESS,
                WSEventType.RIDE_COMPLETED.value: TrackingStatus.COMPLETED,
                WSEventType.DRIVER_STOPPED.value: TrackingStatus.PREPARING,
            }

            svc = RideTrackingService(db)
            ride_id = _UUID(ride_id_str.replace("ride:", ""))
            new_status = phase_map.get(event.event_type)
            if new_status:
                svc.update_tracking_phase(user, ride_id, new_status)

            channel = f"ride:{ride_id}"
            await manager.broadcast_to_room(
                channel,
                WSEvent(
                    event_type=event.event_type,
                    room_id=channel,
                    payload={"ride_id": str(ride_id), "status": new_status.value if new_status else "unknown"},
                ),
            )
        except Exception as e:
            logger.error(f"tracking phase change error on {connection_id}: {e}")
        finally:
            db.close()

    @classmethod
    async def _handle_notification_event(
        cls, connection_id: str, user: User, event: WSEvent
    ) -> None:
        """Processes notification read, sync, or deletion via WebSocket."""
        db = SessionLocal()
        try:
            from uuid import UUID as _UUID
            from app.services.notification import NotificationService

            svc = NotificationService(db)
            event_type = event.event_type

            if event_type == WSEventType.NOTIFICATION_READ.value:
                notif_id = event.payload.get("notification_id")
                if notif_id:
                    svc.mark_read(user, _UUID(str(notif_id)))
            elif event_type == WSEventType.NOTIFICATION_DELETED.value:
                notif_id = event.payload.get("notification_id")
                if notif_id:
                    svc.delete_notification(user, _UUID(str(notif_id)))
            elif event_type == WSEventType.NOTIFICATION_SYNC.value:
                unread_data = svc.get_unread_count(user)
                sync_event = WSEvent(
                    event_type=WSEventType.NOTIFICATION_SYNC.value,
                    payload=unread_data.model_dump(mode="json"),
                )
                await manager.send_personal_event(connection_id, sync_event)
        except Exception as e:
            logger.error(f"notification event error on {connection_id}: {e}")
        finally:
            db.close()
