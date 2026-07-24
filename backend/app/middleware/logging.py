import time
import uuid
from loguru import logger
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Receive, Scope, Send


class LoggingMiddleware:
    """
    Pure ASGI Middleware to log execution duration, route paths, client hosts, 
    inject security response headers and X-Request-ID without BaseHTTPMiddleware async context issues.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()
        path = scope.get("path", "")
        method = scope.get("method", "")
        client = scope.get("client")
        client_host = client[0] if client else "127.0.0.1"

        # Read or generate Request ID from scope headers
        headers_dict = dict(scope.get("headers", []))
        request_id = headers_dict.get(b"x-request-id", str(uuid.uuid4()).encode()).decode()

        logger.info(f"Incoming: {method} {path} from {client_host} [ReqID: {request_id}]")

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                duration = (time.perf_counter() - start_time) * 1000

                headers["X-Request-ID"] = request_id
                headers["X-Process-Time"] = f"{duration:.2f}ms"
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["X-XSS-Protection"] = "1; mode=block"
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"

                status_code = message.get("status", 200)
                logger.info(f"Completed: {method} {path} - Status: {status_code} - Duration: {duration:.2f}ms")

            await send(message)

        try:
            await self.app(scope, receive, send_with_headers)
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(f"Request failed: {method} {path} - Exception: {str(e)} - Duration: {duration:.2f}ms")
            raise e
