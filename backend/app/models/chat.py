from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.schemas.enums import MessageType


class ChatRoom(Base, UUIDMixin, TimestampMixin):
    """
    Temporary Chat Room created per Ride when the first passenger booking is confirmed.
    Expires 24 hours after ride completion.
    """

    ride_id = Column(
        ForeignKey("ride.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    created_by = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    ride = relationship("Ride")
    creator = relationship("User")
    messages = relationship("ChatMessage", back_populates="chat_room", cascade="all, delete-orphan")


class ChatMessage(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Chat message within a temporary ChatRoom.
    Supports user text messages and automated system event broadcasts.
    """

    chat_room_id = Column(
        ForeignKey("chat_room.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    message_type = Column(
        Enum(MessageType),
        default=MessageType.TEXT,
        nullable=False,
    )
    content = Column(String(1000), nullable=False)
    reply_to_message_id = Column(
        ForeignKey("chat_message.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_edited = Column(Boolean, default=False, nullable=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)

    chat_room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User")
    reply_to = relationship("ChatMessage", remote_side="ChatMessage.id")
    read_statuses = relationship("MessageReadStatus", back_populates="message", cascade="all, delete-orphan")


class MessageReadStatus(Base, UUIDMixin, TimestampMixin):
    """
    Tracks read status and read timestamps per user for chat messages.
    """

    message_id = Column(
        ForeignKey("chat_message.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    read_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    message = relationship("ChatMessage", back_populates="read_statuses")
    user = relationship("User")
