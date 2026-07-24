from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from uuid import UUID


class WebSocketManagerInterface(ABC):
    """Extension interface for real-time WebSocket connection manager."""

    @abstractmethod
    async def connect(self, websocket: Any, room_id: UUID, user_id: UUID) -> None:
        pass

    @abstractmethod
    async def disconnect(self, websocket: Any, room_id: UUID) -> None:
        pass

    @abstractmethod
    async def broadcast_to_room(self, room_id: UUID, message: Dict[str, Any]) -> None:
        pass


class OTPEngineInterface(ABC):
    """Extension interface for SMS/WhatsApp OTP verification engine."""

    @abstractmethod
    def send_otp(self, mobile_number: str) -> str:
        pass

    @abstractmethod
    def verify_otp(self, mobile_number: str, otp_code: str) -> bool:
        pass


class MapsGeoServiceInterface(ABC):
    """Extension interface for Google Maps distance matrix, geocoding, and routing."""

    @abstractmethod
    def calculate_distance_km(self, origin: str, destination: str) -> float:
        pass

    @abstractmethod
    def geocode_address(self, address: str) -> Tuple[float, float]:
        pass


class PaymentGatewayInterface(ABC):
    """Extension interface for online digital wallet & card payment gateways (EasyPaisa / JazzCash / Stripe)."""

    @abstractmethod
    def create_payment_intent(self, amount: float, currency: str, booking_id: UUID) -> Dict[str, Any]:
        pass

    @abstractmethod
    def confirm_payment(self, payment_intent_id: str) -> bool:
        pass


class RedisCacheInterface(ABC):
    """Extension interface for Redis caching and session storage."""

    @abstractmethod
    def get(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    def set(self, key: str, value: str, ttl_seconds: int = 300) -> None:
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        pass


class CeleryTaskQueueInterface(ABC):
    """Extension interface for Celery background worker task execution."""

    @abstractmethod
    def enqueue_task(self, task_name: str, *args, **kwargs) -> str:
        pass


class PushNotificationServiceInterface(ABC):
    """Extension interface for Firebase Cloud Messaging (FCM) mobile push alerts."""

    @abstractmethod
    def send_push(self, device_token: str, title: str, body: str, payload: Optional[Dict[str, Any]] = None) -> bool:
        pass
