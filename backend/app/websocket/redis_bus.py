import asyncio
import json
from typing import Callable, Dict, Set
from loguru import logger
from app.core.config import settings

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class InMemoryEventBus:
    """Fallback event bus for single-process development / testing without active Redis server."""

    def __init__(self):
        self.subscribers: Dict[str, Set[Callable]] = {}

    async def publish(self, channel: str, message: str) -> None:
        if channel in self.subscribers:
            for callback in list(self.subscribers[channel]):
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(message)
                    else:
                        callback(message)
                except Exception as e:
                    logger.error(f"InMemoryEventBus callback error on channel {channel}: {e}")

    def subscribe(self, channel: str, callback: Callable) -> None:
        if channel not in self.subscribers:
            self.subscribers[channel] = set()
        self.subscribers[channel].add(callback)

    def unsubscribe(self, channel: str, callback: Callable) -> None:
        if channel in self.subscribers:
            self.subscribers[channel].discard(callback)


class RedisEventBus:
    """
    Asynchronous Redis Pub/Sub manager enabling horizontal multi-instance scaling.
    Falls back gracefully to InMemoryEventBus if Redis instance connection fails.
    """

    def __init__(self):
        self.redis_client = None
        self.pubsub = None
        self.is_connected = False
        self.fallback_bus = InMemoryEventBus()
        self._listen_task = None
        self._channel_callbacks: Dict[str, Set[Callable]] = {}

    async def connect(self) -> bool:
        if not REDIS_AVAILABLE:
            logger.info("redis-py module unavailable. Running WebSocket bus in in-memory mode.")
            self.is_connected = False
            return False

        try:
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2.0
            )
            await self.redis_client.ping()
            self.is_connected = True
            logger.info(f"Connected to Redis Pub/Sub at {settings.REDIS_URL}")
            return True
        except Exception as e:
            logger.warning(f"Could not connect to Redis ({e}). Operating WebSocket bus in fallback mode.")
            self.is_connected = False
            return False

    async def publish(self, channel: str, message: str) -> None:
        """Publish a message string or payload to a channel."""
        if self.is_connected and self.redis_client:
            try:
                await self.redis_client.publish(channel, message)
            except Exception as e:
                logger.error(f"Redis publish error on {channel}: {e}. Falling back to in-memory.")
                await self.fallback_bus.publish(channel, message)
        else:
            await self.fallback_bus.publish(channel, message)

    async def subscribe(self, channel: str, callback: Callable) -> None:
        """Subscribe to a channel and register callback handler."""
        if channel not in self._channel_callbacks:
            self._channel_callbacks[channel] = set()
        self._channel_callbacks[channel].add(callback)

        self.fallback_bus.subscribe(channel, callback)

        if self.is_connected and self.redis_client:
            try:
                if not self.pubsub:
                    self.pubsub = self.redis_client.pubsub()
                    self._listen_task = asyncio.create_task(self._listen_loop())

                await self.pubsub.subscribe(channel)
            except Exception as e:
                logger.error(f"Redis subscribe failure on {channel}: {e}")

    async def unsubscribe(self, channel: str, callback: Callable) -> None:
        """Unsubscribe callback from channel."""
        if channel in self._channel_callbacks:
            self._channel_callbacks[channel].discard(callback)

        self.fallback_bus.unsubscribe(channel, callback)

        if self.is_connected and self.pubsub:
            try:
                await self.pubsub.unsubscribe(channel)
            except Exception as e:
                logger.error(f"Redis unsubscribe failure on {channel}: {e}")

    async def _listen_loop(self) -> None:
        """Listen loop processing incoming Redis Pub/Sub messages."""
        while self.is_connected and self.pubsub:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    callbacks = self._channel_callbacks.get(channel, set())
                    for cb in list(callbacks):
                        try:
                            if asyncio.iscoroutinefunction(cb):
                                await cb(data)
                            else:
                                cb(data)
                        except Exception as cb_err:
                            logger.error(f"Error handling message on channel {channel}: {cb_err}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Redis Pub/Sub listener error: {e}")
                await asyncio.sleep(1.0)

    async def disconnect(self) -> None:
        """Close pubsub and redis connection cleanly."""
        self.is_connected = False
        if self._listen_task:
            self._listen_task.cancel()
        if self.pubsub:
            try:
                await self.pubsub.close()
            except Exception:
                pass
        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception:
                pass


# Global singleton instance for app-wide event bus
redis_bus = RedisEventBus()
