from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc

from app.models.booking import Booking
from app.models.chat import ChatMessage, ChatRoom, MessageReadStatus
from app.models.ride import Ride
from app.models.user import DriverProfile, User
from app.schemas.enums import ConfirmedBookingStatus, MessageType, RideStatus


class ChatRepository:
    """Database operations for ChatRoom entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: UUID) -> Optional[ChatRoom]:
        return self.db.query(ChatRoom).options(
            joinedload(ChatRoom.ride).joinedload(Ride.driver_profile).joinedload(DriverProfile.user),
            joinedload(ChatRoom.creator),
        ).filter(ChatRoom.id == room_id).first()

    def get_by_ride_id(self, ride_id: UUID) -> Optional[ChatRoom]:
        return self.db.query(ChatRoom).filter(ChatRoom.ride_id == ride_id).first()

    def create_room(self, ride_id: UUID, created_by: UUID) -> ChatRoom:
        room = ChatRoom(
            ride_id=ride_id,
            created_by=created_by,
            is_active=True,
        )
        self.db.add(room)
        self.db.flush()
        return room

    def list_rooms_for_user(self, user_id: UUID) -> List[ChatRoom]:
        """
        Finds all active chat rooms where user is either:
        1. The publishing driver of the ride.
        2. A passenger with a CONFIRMED booking on the ride.
        """
        driver_profile = self.db.query(DriverProfile).filter(DriverProfile.user_id == user_id).first()
        driver_profile_id = driver_profile.id if driver_profile else None

        # Confirmed ride IDs for passenger
        confirmed_ride_ids = [
            b.ride_id for b in self.db.query(Booking.ride_id).filter(
                Booking.passenger_id == user_id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            ).all()
        ]

        filters = []
        if driver_profile_id:
            filters.append(Ride.driver_profile_id == driver_profile_id)
        if confirmed_ride_ids:
            filters.append(ChatRoom.ride_id.in_(confirmed_ride_ids))

        if not filters:
            return []

        return self.db.query(ChatRoom).options(
            joinedload(ChatRoom.ride),
            joinedload(ChatRoom.creator),
        ).join(Ride).filter(
            or_(*filters),
        ).order_by(ChatRoom.created_at.desc()).all()


class MessageRepository:
    """Database operations for ChatMessage entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, message_id: UUID) -> Optional[ChatMessage]:
        return self.db.query(ChatMessage).options(
            joinedload(ChatMessage.sender),
            joinedload(ChatMessage.reply_to),
        ).filter(
            ChatMessage.id == message_id,
            ChatMessage.is_deleted == False,
        ).first()

    def create_message(
        self,
        *,
        chat_room_id: UUID,
        sender_id: Optional[UUID] = None,
        message_type: MessageType = MessageType.TEXT,
        content: str,
        reply_to_message_id: Optional[UUID] = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            chat_room_id=chat_room_id,
            sender_id=sender_id,
            message_type=message_type,
            content=content,
            reply_to_message_id=reply_to_message_id,
        )
        self.db.add(msg)
        self.db.flush()
        return msg

    def edit_message(self, message: ChatMessage, new_content: str) -> ChatMessage:
        message.content = new_content
        message.is_edited = True
        message.edited_at = datetime.now(timezone.utc)
        self.db.flush()
        return message

    def soft_delete_message(self, message: ChatMessage) -> ChatMessage:
        message.is_deleted = True
        message.deleted_at = datetime.now(timezone.utc)
        message.content = "[Message deleted]"
        self.db.flush()
        return message

    def list_messages(self, chat_room_id: UUID, page: int = 1, size: int = 50) -> List[ChatMessage]:
        offset = (page - 1) * size
        return self.db.query(ChatMessage).options(
            joinedload(ChatMessage.sender),
            joinedload(ChatMessage.reply_to),
        ).filter(
            ChatMessage.chat_room_id == chat_room_id,
            ChatMessage.is_deleted == False,
        ).order_by(ChatMessage.created_at.asc()).offset(offset).limit(size).all()

    def get_last_message(self, chat_room_id: UUID) -> Optional[ChatMessage]:
        return self.db.query(ChatMessage).filter(
            ChatMessage.chat_room_id == chat_room_id,
            ChatMessage.is_deleted == False,
        ).order_by(ChatMessage.created_at.desc()).first()

    def mark_message_read(self, message_id: UUID, user_id: UUID) -> MessageReadStatus:
        existing = self.db.query(MessageReadStatus).filter(
            MessageReadStatus.message_id == message_id,
            MessageReadStatus.user_id == user_id,
        ).first()

        if existing:
            return existing

        read_status = MessageReadStatus(
            message_id=message_id,
            user_id=user_id,
            read_at=datetime.now(timezone.utc),
        )
        self.db.add(read_status)
        self.db.flush()
        return read_status

    def get_read_count(self, message_id: UUID) -> int:
        return self.db.query(MessageReadStatus).filter(
            MessageReadStatus.message_id == message_id,
        ).count()

    def is_read_by_user(self, message_id: UUID, user_id: UUID) -> bool:
        status_rec = self.db.query(MessageReadStatus).filter(
            MessageReadStatus.message_id == message_id,
            MessageReadStatus.user_id == user_id,
        ).first()
        return status_rec is not None

    def get_unread_count_for_room(self, chat_room_id: UUID, user_id: UUID) -> int:
        """Count unread messages in room for user (excluding user's own sent messages)."""
        from sqlalchemy import select
        read_msg_ids_stmt = select(MessageReadStatus.message_id).where(
            MessageReadStatus.user_id == user_id,
        ).scalar_subquery()

        return self.db.query(ChatMessage).filter(
            ChatMessage.chat_room_id == chat_room_id,
            ChatMessage.sender_id != user_id,
            ChatMessage.is_deleted == False,
            ChatMessage.id.not_in(read_msg_ids_stmt),
        ).count()
