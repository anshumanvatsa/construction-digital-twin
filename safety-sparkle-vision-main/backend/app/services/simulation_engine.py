import asyncio
from datetime import datetime, timezone
import json
import random

import structlog
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.redis_client import redis_client
from app.core.settings import get_settings
from app.models.hazard import Hazard
from app.models.simulation_state import SimulationState
from app.models.worker import Worker
from app.schemas.alert import AlertPayload
from app.services.alert_engine import create_alert
from app.services.risk_engine import compute_worker_risk

settings = get_settings()
logger = structlog.get_logger(__name__)


class SimulationEngine:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._lock = asyncio.Lock()
        self._running = False

    @property
    def running(self) -> bool:
        return self._running

    async def start(self) -> bool:
        async with self._lock:
            if self._running:
                return False
            self._running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("simulation_started")
            return True

    async def stop(self) -> bool:
        async with self._lock:
            if not self._running:
                return False

            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass

            self._task = None
            self._running = False
            logger.info("simulation_stopped")
            return True

    async def _run_loop(self) -> None:
        try:
            while True:
                await self._tick()
                await asyncio.sleep(settings.simulation_interval_seconds)
        except asyncio.CancelledError:
            logger.info("simulation_loop_cancelled")
            raise
        except Exception:
            self._running = False
            logger.exception("simulation_loop_failed")

    async def _tick(self) -> None:
        async with SessionLocal() as db:
            workers = list((await db.scalars(select(Worker))).all())
            hazards = list((await db.scalars(select(Hazard))).all())

            worker_updates: list[dict] = []
            hazard_updates: list[dict] = []
            alerts_payload: list[dict] = []

            for worker in workers:
                worker.position_x = max(0.0, min(99.0, worker.position_x + random.uniform(-1.8, 1.8)))
                worker.position_y = max(0.0, min(99.0, worker.position_y + random.uniform(-1.8, 1.8)))
                worker.fatigue_level = max(0.0, min(100.0, worker.fatigue_level + random.uniform(-0.2, 1.0)))

                exposure_map = await self._update_exposure(worker, hazards)
                risk_score, risk_level, nearby_hazards = compute_worker_risk(worker, hazards, exposure_map)
                worker.risk_score = risk_score

                worker_updates.append(
                    {
                        "id": worker.id,
                        "name": worker.name,
                        "role": worker.role,
                        "fatigue_level": round(worker.fatigue_level, 2),
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                        "position": {"x": round(worker.position_x, 2), "y": round(worker.position_y, 2)},
                        "status": worker.status,
                    }
                )

                for hazard in nearby_hazards:
                    proximity_alert = await self._create_proximity_alert_if_needed(db, worker, hazard)
                    if proximity_alert:
                        alerts_payload.append(proximity_alert)

                if risk_level == "HIGH":
                    risk_alert = await self._create_high_risk_alert_if_needed(db, worker)
                    if risk_alert:
                        alerts_payload.append(risk_alert)

            for hazard in hazards:
                hazard_updates.append(
                    {
                        "id": hazard.id,
                        "type": hazard.type,
                        "severity": hazard.severity,
                        "center": {"x": hazard.center_x, "y": hazard.center_y},
                        "radius": hazard.radius,
                        "active_time": hazard.active_time.isoformat(),
                    }
                )

            envelope = {
                "type": "simulation_snapshot",
                "event": "simulation_tick",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "workers": worker_updates,
                    "hazards": hazard_updates,
                    "alerts": alerts_payload,
                },
            }

            serialized = json.dumps(envelope)
            state = await db.scalar(select(SimulationState).where(SimulationState.state_key == "current_snapshot"))
            if state:
                state.state_value = envelope
            else:
                db.add(SimulationState(state_key="current_snapshot", state_value=envelope))

            await db.commit()

            await redis_client.publish(settings.simulation_channel, serialized)
            for alert in alerts_payload:
                alert_envelope = {
                    "type": "alert",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "payload": alert,
                }
                await redis_client.publish(settings.simulation_channel, json.dumps(alert_envelope))
            await redis_client.set("simulation:last_state", serialized, ex=120)

    async def _update_exposure(self, worker: Worker, hazards: list[Hazard]) -> dict[int, float]:
        exposure_seconds_by_hazard: dict[int, float] = {}

        for hazard in hazards:
            if hazard.radius is None:
                continue

            distance = ((worker.position_x - hazard.center_x) ** 2 + (worker.position_y - hazard.center_y) ** 2) ** 0.5
            key = f"exposure:{worker.id}:{hazard.id}"

            if distance <= hazard.radius:
                exposure = await redis_client.incrbyfloat(key, settings.simulation_interval_seconds)
            else:
                await redis_client.set(key, 0.0, ex=300)
                exposure = 0.0

            await redis_client.expire(key, 300)
            exposure_seconds_by_hazard[hazard.id] = float(exposure)

        return exposure_seconds_by_hazard

    async def _create_proximity_alert_if_needed(self, db, worker: Worker, hazard: Hazard) -> dict | None:
        dedupe_key = f"alert:proximity:{worker.id}:{hazard.id}"
        if await redis_client.exists(dedupe_key):
            return None

        alert = await create_alert(
            db=db,
            worker=worker,
            hazard=hazard,
            alert_type="worker_in_hazard_zone",
            severity="HIGH" if hazard.severity >= 8 else "MEDIUM",
            message=f"{worker.name} entered {hazard.type} hazard zone",
        )
        await redis_client.set(dedupe_key, "1", ex=20)

        payload = AlertPayload(
            id=alert.id,
            type=alert.type,
            severity=alert.severity,
            timestamp=alert.timestamp,
            message=alert.message,
            worker_id=alert.worker_id,
            hazard_id=alert.hazard_id,
        )
        return payload.model_dump(mode="json")

    async def _create_high_risk_alert_if_needed(self, db, worker: Worker) -> dict | None:
        dedupe_key = f"alert:high_risk:{worker.id}"
        if await redis_client.exists(dedupe_key):
            return None

        alert = await create_alert(
            db=db,
            worker=worker,
            hazard=None,
            alert_type="risk_threshold_exceeded",
            severity="HIGH",
            message=f"{worker.name} risk score is critically high ({worker.risk_score})",
        )
        await redis_client.set(dedupe_key, "1", ex=25)

        payload = AlertPayload(
            id=alert.id,
            type=alert.type,
            severity=alert.severity,
            timestamp=alert.timestamp,
            message=alert.message,
            worker_id=alert.worker_id,
            hazard_id=alert.hazard_id,
        )
        return payload.model_dump(mode="json")


simulation_engine = SimulationEngine()
