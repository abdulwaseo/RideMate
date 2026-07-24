from typing import Optional
from uuid import UUID
from fastapi import WebSocket, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.user import User
from app.repositories.user import UserRepository


class SocketAuthenticator:
    """
    Validates JWT tokens and resolves active User entities for WebSocket handshake requests.
    """

    @staticmethod
    def extract_token_from_websocket(websocket: WebSocket) -> Optional[str]:
        """
        Extract token from query parameters, Sec-WebSocket-Protocol, or Authorization header.
        """
        # 1. Query parameters (?token=xxx)
        token = websocket.query_params.get("token")
        if token:
            return token

        # 2. Sec-WebSocket-Protocol header (e.g. bearer, token_value)
        ws_protocols = websocket.headers.get("sec-websocket-protocol")
        if ws_protocols:
            parts = [p.strip() for p in ws_protocols.split(",")]
            if len(parts) >= 2 and parts[0].lower() == "bearer":
                return parts[1]
            elif len(parts) == 1 and parts[0]:
                return parts[0]

        # 3. Standard Authorization header (Bearer xxx)
        auth_header = websocket.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]

        return None

    @classmethod
    def authenticate(cls, token: Optional[str], db: Session) -> Optional[User]:
        """
        Validates token signature, token type, and user state in DB.
        """
        if not token:
            return None

        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None

        user_id_str = payload.get("sub")
        if not user_id_str:
            return None

        try:
            user_id = UUID(user_id_str)
        except ValueError:
            return None

        user_repo = UserRepository(db)
        user = user_repo.get_by_id(user_id)
        if not user or user.is_deleted:
            return None

        return user
