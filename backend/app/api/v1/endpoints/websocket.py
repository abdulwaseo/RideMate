from typing import Optional
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from loguru import logger

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.websocket import WSEvent, WSEventType, WSStatsResponse
from app.services.websocket_service import WebSocketService
from app.websocket.connection_manager import manager
from app.websocket.event_dispatcher import EventDispatcher
from app.websocket.socket_auth import SocketAuthenticator

router = APIRouter()


@router.websocket("/ws")
@router.websocket("/api/v1/ws")
async def websocket_gateway(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Main WebSocket Gateway Endpoint for real-time communications.
    Requires valid JWT token in query param (?token=xxx) or Sec-WebSocket-Protocol / Bearer header.
    """
    # Extract token fallback if not passed in query params
    if not token:
        token = SocketAuthenticator.extract_token_from_websocket(websocket)

    user = SocketAuthenticator.authenticate(token, db)
    if not user:
        logger.warning("Rejected unauthorized WebSocket connection request.")
        # Reject handshake
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized: Invalid or missing JWT token")
        return

    connection_id, is_reconnect = await manager.connect(websocket, user)
    if not connection_id:
        return

    # Send initial welcome / connection frame
    from datetime import datetime, timezone
    welcome_event = WSEvent(
        event_type=WSEventType.CONNECT.value,
        payload={
            "connection_id": connection_id,
            "user_id": str(user.id),
            "reconnected": is_reconnect,
            "server_time": datetime.now(timezone.utc).isoformat(),
        },
    )
    await manager.send_personal_event(connection_id, welcome_event)

    try:
        while True:
            raw_text = await websocket.receive_text()
            await EventDispatcher.dispatch(connection_id, user, raw_text)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected normally: {connection_id}")
        await manager.disconnect(connection_id, reason="Client disconnected")
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket loop for {connection_id}: {e}")
        await manager.disconnect(connection_id, reason=f"Unexpected error: {str(e)}")


@router.get("/ws/stats", response_model=WSStatsResponse)
def get_websocket_monitoring_stats(current_user: User = Depends(get_current_user)):
    """
    REST endpoint to query real-time WebSocket connection monitoring metrics.
    Requires authenticated user.
    """
    service = WebSocketService()
    return service.get_monitoring_stats()
