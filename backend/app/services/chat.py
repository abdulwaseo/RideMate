from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat import ChatRoom, ChatMessage
from app.models.booking import Booking, RideRequest
from app.models.user import User
from app.repositories.booking import BookingRepository
from app.repositories.chat import ChatRepository, MessageRepository
from app.repositories.driver import DriverRepository
from app.repositories.ride import RideRepository
from app.schemas.chat import (
    ChatRoomResponse,
    MessageResponse,
    ReplyMessageBrief,
    UserParticipant,
)
from app.schemas.enums import ConfirmedBookingStatus, BookingStatus, MessageType, RideStatus


class ChatService:
    """Business logic for temporary Ride ChatRooms and Messages."""

    def __init__(self, db: Session):
        self.db = db
        self.chat_repo = ChatRepository(db)
        self.msg_repo = MessageRepository(db)
        self.ride_repo = RideRepository(db)
        self.driver_repo = DriverRepository(db)
        self.booking_repo = BookingRepository(db)

    def get_or_create_room_for_ride(self, ride_id: UUID, driver_user_id: UUID) -> ChatRoom:
        """Automatically retrieves or creates a ChatRoom for a ride."""
        existing = self.chat_repo.get_by_ride_id(ride_id)
        if existing:
            return existing
        room = self.chat_repo.create_room(ride_id=ride_id, created_by=driver_user_id)
        self.db.commit()
        self.db.refresh(room)
        return room

    def list_user_rooms(self, user: User) -> List[ChatRoomResponse]:
        """List all active chat rooms accessible to user."""
        rooms = self.chat_repo.list_rooms_for_user(user.id)
        return [self._format_room_response(r, user.id) for r in rooms]

    def get_room_detail(self, user: User, room_id: UUID) -> ChatRoomResponse:
        """Get detail of a specific chat room after checking participant permissions."""
        room = self.chat_repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        if not self._verify_room_access(user, room):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[CHAT_002] Access denied: You are not an active participant of this ride.",
            )

        return self._format_room_response(room, user.id)

    def post_message(
        self,
        user: User,
        room_id: UUID,
        content: str,
        message_type: MessageType = MessageType.TEXT,
        reply_to_message_id: Optional[UUID] = None,
    ) -> MessageResponse:
        """Posts a new chat message to a room."""
        room = self.chat_repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        if not self._verify_room_access(user, room):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[CHAT_002] Access denied to chat room.",
            )

        if not room.is_active or (room.expires_at and room.expires_at < datetime.now(timezone.utc)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[CHAT_001] Room is inactive or expired. Messages are closed.",
            )

        if len(content.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty.",
            )

        msg = self.msg_repo.create_message(
            chat_room_id=room_id,
            sender_id=user.id,
            message_type=message_type,
            content=content,
            reply_to_message_id=reply_to_message_id,
        )
        self.db.commit()
        return self._format_message_response(msg, user.id)

    def edit_message(self, user: User, room_id: UUID, message_id: UUID, new_content: str) -> MessageResponse:
        """Edits an existing text message sent by user."""
        msg = self.msg_repo.get_by_id(message_id)
        if not msg or msg.chat_room_id != room_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

        if msg.sender_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own messages.",
            )

        updated = self.msg_repo.edit_message(msg, new_content)
        self.db.commit()
        return self._format_message_response(updated, user.id)

    def delete_message(self, user: User, room_id: UUID, message_id: UUID) -> MessageResponse:
        """Soft deletes a message sent by user or driver admin."""
        msg = self.msg_repo.get_by_id(message_id)
        if not msg or msg.chat_room_id != room_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

        room = self.chat_repo.get_by_id(room_id)
        is_driver_admin = False
        if room and room.ride and room.ride.driver_profile:
            is_driver_admin = room.ride.driver_profile.user_id == user.id

        if msg.sender_id != user.id and not is_driver_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own messages.",
            )

        deleted = self.msg_repo.soft_delete_message(msg)
        self.db.commit()
        return self._format_message_response(deleted, user.id)

    def mark_messages_read(self, user: User, room_id: UUID, message_ids: List[UUID]) -> int:
        """Marks specified messages in a room as read by user."""
        room = self.chat_repo.get_by_id(room_id)
        if not room or not self._verify_room_access(user, room):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="[CHAT_002] Access denied.")

        marked_count = 0
        for m_id in message_ids:
            msg = self.msg_repo.get_by_id(m_id)
            if msg and msg.chat_room_id == room_id and msg.sender_id != user.id:
                self.msg_repo.mark_message_read(m_id, user.id)
                marked_count += 1

        self.db.commit()
        return marked_count

    def get_messages(self, user: User, room_id: UUID, page: int = 1, size: int = 50) -> List[MessageResponse]:
        """Retrieves paginated message history for a room."""
        room = self.chat_repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        if not self._verify_room_access(user, room):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="[CHAT_002] Access denied.")

        messages = self.msg_repo.list_messages(room_id, page, size)
        return [self._format_message_response(m, user.id) for m in messages]

    def _verify_room_access(self, user: User, room: ChatRoom) -> bool:
        """Check if user is driver or confirmed/accepted passenger of the room's ride."""
        if not room.ride:
            return False

        # 1. Driver verification
        driver_profile = self.driver_repo.get_by_user_id(user.id)
        is_driver = (
            (driver_profile and room.ride.driver_profile_id == driver_profile.id)
            or (room.ride.driver_profile and room.ride.driver_profile.user_id == user.id)
            or room.created_by == user.id
        )
        if is_driver:
            return True

        # 2. Confirmed Booking verification
        booking = (
            self.db.query(Booking)
            .filter(
                Booking.ride_id == room.ride_id,
                Booking.passenger_id == user.id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            )
            .first()
        )
        if booking:
            return True

        # 3. Accepted RideRequest verification
        ride_req = (
            self.db.query(RideRequest)
            .filter(
                RideRequest.ride_id == room.ride_id,
                RideRequest.passenger_id == user.id,
                RideRequest.status == BookingStatus.ACCEPTED,
                RideRequest.is_deleted == False,
            )
            .first()
        )
        return ride_req is not None

    def _format_room_response(self, room: ChatRoom, current_user_id: UUID) -> ChatRoomResponse:
        participants = []
        if room.ride and room.ride.driver_profile and room.ride.driver_profile.user:
            participants.append(
                UserParticipant(
                    id=room.ride.driver_profile.user.id,
                    name=room.ride.driver_profile.user.name,
                    role="Driver",
                )
            )

        passengers = (
            self.db.query(User)
            .join(Booking, Booking.passenger_id == User.id)
            .filter(
                Booking.ride_id == room.ride_id,
                Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
                Booking.is_deleted == False,
            )
            .all()
        )
        for p in passengers:
            participants.append(
                UserParticipant(
                    id=p.id,
                    name=p.name,
                    role="Passenger",
                )
            )

        last_msg = self.msg_repo.get_last_message(room.id)
        last_msg_fmt = self._format_message_response(last_msg, current_user_id) if last_msg else None
        unread = self.msg_repo.get_unread_count_for_room(room.id, current_user_id)

        return ChatRoomResponse(
            id=room.id,
            ride_id=room.ride_id,
            created_by=room.created_by,
            is_active=room.is_active,
            expires_at=room.expires_at,
            created_at=room.created_at,
            participants=participants,
            unread_count=unread,
            last_message=last_msg_fmt,
        )

    def _format_message_response(self, msg: ChatMessage, current_user_id: UUID) -> MessageResponse:
        sender_name = msg.sender.name if msg.sender else "System"
        read_count = self.msg_repo.get_read_count(msg.id)
        read_by_me = self.msg_repo.is_read_by_user(msg.id, current_user_id)

        reply_brief = None
        if msg.reply_to:
            reply_sender = msg.reply_to.sender.name if msg.reply_to.sender else "System"
            reply_brief = ReplyMessageBrief(
                id=msg.reply_to.id,
                sender_name=reply_sender,
                content=msg.reply_to.content,
            )

        return MessageResponse(
            id=msg.id,
            chat_room_id=msg.chat_room_id,
            sender_id=msg.sender_id,
            sender_name=sender_name,
            message_type=msg.message_type,
            content=msg.content,
            reply_to_message_id=msg.reply_to_message_id,
            reply_to=reply_brief,
            is_edited=msg.is_edited,
            edited_at=msg.edited_at,
            is_deleted=msg.is_deleted,
            read_count=read_count,
            read_by_me=read_by_me,
            created_at=msg.created_at,
        )
