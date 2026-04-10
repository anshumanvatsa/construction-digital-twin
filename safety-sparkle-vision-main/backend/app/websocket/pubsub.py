import asyncio

import structlog

from app.core.redis_client import redis_client
from app.core.settings import get_settings
from app.websocket.manager import connection_manager

settings = get_settings()
logger = structlog.get_logger(__name__)


async def relay_redis_messages() -> None:
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(settings.simulation_channel)
    logger.info("redis_pubsub_subscribed", channel=settings.simulation_channel)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.05)
                continue

            data = message.get("data")
            if isinstance(data, str):
                await connection_manager.broadcast_text(data)
    except asyncio.CancelledError:
        logger.info("redis_pubsub_cancelled")
        raise
    finally:
        await pubsub.unsubscribe(settings.simulation_channel)
        await pubsub.aclose()
