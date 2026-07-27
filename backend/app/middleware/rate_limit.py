import json
import time
from collections import defaultdict
from typing import Dict, List
from loguru import logger
from starlette.types import ASGIApp, Receive, Scope, Send


class RateLimitMiddleware:
    """
    Pure ASGI Sliding-window rate limiting middleware preventing DoS attacks.
    Restricts client requests per minute based on IP address.
    """

    def __init__(self, app: ASGIApp, requests_per_minute: int = 1200):
        self.app = app
        self.requests_per_minute = requests_per_minute
        self.client_requests: Dict[str, List[float]] = defaultdict(list)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "")

        # Always allow OPTIONS preflight requests through without rate limiting
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Skip rate limit for health checks, testing, or development environments
        from app.core.config import settings
        if settings.APP_ENV in ("development", "dev", "testing", "test", "local") or path.startswith("/api/v1/health") or path == "/health":
            await self.app(scope, receive, send)
            return

        client = scope.get("client")
        client_ip = client[0] if client else "127.0.0.1"

        now = time.time()
        window_start = now - 60.0

        # Clean old requests outside 60s window
        timestamps = self.client_requests[client_ip]
        self.client_requests[client_ip] = [ts for ts in timestamps if ts > window_start]

        if len(self.client_requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            body = json.dumps({
                "success": False,
                "message": "[SYSTEM_002] Rate limit exceeded.",
                "error_code": "SYSTEM_002",
                "data": None,
            }).encode()

            # Get request origin if present
            origin_header = b"*"
            for h_name, h_val in scope.get("headers", []):
                if h_name.lower() == b"origin":
                    origin_header = h_val
                    break

            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"retry-after", b"60"),
                    (b"access-control-allow-origin", origin_header),
                    (b"access-control-allow-credentials", b"true"),
                    (b"access-control-allow-headers", b"*"),
                    (b"access-control-allow-methods", b"*"),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": body,
            })
            return

        self.client_requests[client_ip].append(now)
        await self.app(scope, receive, send)
