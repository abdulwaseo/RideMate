from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.enums import MessageType


class UserParticipant(BaseModel):
    """Participant details in a ChatRoom."""

    id: UUID
    name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    """Payload to post a message in a ChatRoom."""

    content: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        examples=["I am waiting near the main entrance."],
        description="Text message content.",
    )
    message_type: MessageType = MessageType.TEXT
    reply_to_message_id: Optional[UUID] = None


class MessageEdit(BaseModel):
    """Payload to edit an existing text message."""

    content: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Updated text content.",
    )


class MessageReadPayload(BaseModel):
    """Payload to mark messages as read."""

    message_ids: List[UUID] = Field(default_factory=list)


class TypingPayload(BaseModel):
    """Payload for typing indicator events."""

    is_typing: bool = True


class ReplyMessageBrief(BaseModel):
    """Brief summary of a replied message."""

    id: UUID
    sender_name: Optional[str] = None
    content: str

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Output representation of a ChatMessage."""

    id: UUID
    chat_room_id: UUID
    sender_id: Optional[UUID] = None
    sender_name: Optional[str] = None
    message_type: MessageType
    content: str
    reply_to_message_id: Optional[UUID] = None
    reply_to: Optional[ReplyMessageBrief] = None
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    read_count: int = 0
    read_by_me: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRoomResponse(BaseModel):
    """Output representation of a ChatRoom."""

    id: UUID
    ride_id: UUID
    created_by: UUID
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    participants: List[UserParticipant] = []
    unread_count: int = 0
    last_message: Optional[MessageResponse] = None

    model_config = ConfigDict(from_attributes=True)
