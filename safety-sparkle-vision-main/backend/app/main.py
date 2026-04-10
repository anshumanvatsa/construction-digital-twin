import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import structlog

from app.api.router import api_router
from app.core.database import Base, SessionLocal, assert_migrations_ready, engine
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import setup_middleware
from app.core.rate_limit import limiter
from app.core.redis_client import redis_client
from app.core.settings import get_settings
from app.models.simulation_state import SimulationState
from app.services.simulation_engine import simulation_engine
from app.utils.seed_data import seed_initial_data
from app.websocket.manager import connection_manager
from app.websocket.pubsub import relay_redis_messages

# Ensure SQLAlchemy model metadata is loaded.
from app import models  # noqa: F401

settings = get_settings()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("app_starting", environment=settings.environment)

    if settings.auto_create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_initialized", mode="auto_create_tables")
    elif settings.enforce_migrations:
        await assert_migrations_ready()
        logger.info("database_initialized", mode="migrations_verified")
    else:
        logger.warning("database_initialization_skipped")

    if settings.auto_seed_data:
        from app.core.database import SessionLocal

        async with SessionLocal() as session:
            await seed_initial_data(session)

    relay_task = asyncio.create_task(relay_redis_messages())
    app.state.relay_task = relay_task

    if settings.auto_start_simulation:
        await simulation_engine.start()

    try:
        yield
    finally:
        await simulation_engine.stop()

        relay = getattr(app.state, "relay_task", None)
        if relay:
            relay.cancel()
            try:
                await relay
            except asyncio.CancelledError:
                pass

        await redis_client.aclose()
        await engine.dispose()
        logger.info("app_stopped")


app = FastAPI(title=settings.project_name, version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

setup_middleware(app)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict:
    simulation_status = "running" if simulation_engine.running else "stopped"
    return {"status": "ok", "simulation": simulation_status, "environment": settings.environment}


@app.get("/health/ready")
async def health_ready() -> dict:
    db_ok = False
    redis_ok = False

    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.exception("health_db_check_failed")

    try:
        redis_ok = bool(await redis_client.ping())
    except Exception:
        logger.exception("health_redis_check_failed")

    status = "ok" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "checks": {
            "database": db_ok,
            "redis": redis_ok,
            "simulation": simulation_engine.running,
        },
        "environment": settings.environment,
    }


@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket) -> None:
    await connection_manager.connect(websocket)
    logger.info("websocket_connected", client=str(websocket.client))

    try:
        last_state = await redis_client.get("simulation:last_state")
        if last_state:
            await websocket.send_text(last_state)

        while True:
            message = await websocket.receive_text()
            if message.lower() == "ping":
                await websocket.send_json(
                    {
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "payload": {"event": "pong"},
                    }
                )
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info("websocket_disconnected", client=str(websocket.client))
    except Exception:
        connection_manager.disconnect(websocket)
        logger.exception("websocket_failed")
