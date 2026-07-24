from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatRoomResponse,
    MessageCreate,
    MessageEdit,
    MessageReadPayload,
    MessageResponse,
)
from app.schemas.response import ErrorResponse, SuccessResponse
from app.services.chat import ChatService

router = APIRouter()


@router.get(
    "",
    response_model=SuccessResponse[List[ChatRoomResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Accessible Chat Rooms",
)
@router.get(
    "/rooms",
    response_model=SuccessResponse[List[ChatRoomResponse]],
    status_code=status.HTTP_200_OK,
    summary="List My Accessible Chat Rooms (Alias)",
)
def list_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    rooms = svc.list_user_rooms(current_user)
    return SuccessResponse(message="Accessible chat rooms retrieved.", data=rooms)


@router.get(
    "/{room_id}",
    response_model=SuccessResponse[ChatRoomResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Chat Room Details",
)
@router.get(
    "/rooms/{room_id}",
    response_model=SuccessResponse[ChatRoomResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Chat Room Details (Alias)",
)
def get_chat_room(
    room_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    room = svc.get_room_detail(current_user, room_id)
    return SuccessResponse(message="Chat room details retrieved.", data=room)


@router.post(
    "/{room_id}/messages",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Send Message to Chat Room",
)
@router.post(
    "/rooms/{room_id}/messages",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Send Message to Chat Room (Alias)",
)
def send_chat_message(
    room_id: UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    msg_resp = svc.post_message(
        user=current_user,
        room_id=room_id,
        content=payload.content,
        message_type=payload.message_type,
        reply_to_message_id=payload.reply_to_message_id,
    )
    return SuccessResponse(message="Message posted successfully.", data=msg_resp)


@router.get(
    "/{room_id}/messages",
    response_model=SuccessResponse[List[MessageResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Chat Message History",
)
@router.get(
    "/rooms/{room_id}/messages",
    response_model=SuccessResponse[List[MessageResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Chat Message History (Alias)",
)
def get_chat_messages(
    room_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    messages = svc.get_messages(current_user, room_id, page, size)
    return SuccessResponse(message="Chat message history retrieved.", data=messages)


@router.put(
    "/{room_id}/messages/{message_id}",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Edit Chat Message",
)
@router.put(
    "/rooms/{room_id}/messages/{message_id}",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Edit Chat Message (Alias)",
)
def edit_chat_message(
    room_id: UUID,
    message_id: UUID,
    payload: MessageEdit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    updated = svc.edit_message(current_user, room_id, message_id, payload.content)
    return SuccessResponse(message="Message updated successfully.", data=updated)


@router.delete(
    "/{room_id}/messages/{message_id}",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Delete Chat Message",
)
@router.delete(
    "/rooms/{room_id}/messages/{message_id}",
    response_model=SuccessResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Delete Chat Message (Alias)",
)
def delete_chat_message(
    room_id: UUID,
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    deleted = svc.delete_message(current_user, room_id, message_id)
    return SuccessResponse(message="Message deleted successfully.", data=deleted)


@router.post(
    "/{room_id}/read",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Mark Messages as Read",
)
@router.post(
    "/rooms/{room_id}/read",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Mark Messages as Read (Alias)",
)
def mark_messages_read(
    room_id: UUID,
    payload: MessageReadPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = ChatService(db)
    count = svc.mark_messages_read(current_user, room_id, payload.message_ids)
    return SuccessResponse(message=f"{count} messages marked as read.", data={"marked_count": count})
