from fastapi import APIRouter, Depends, Request

from app.core.auth import require_roles
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.simulation import SimulationControlResponse
from app.services.simulation_engine import simulation_engine

router = APIRouter()


@router.post("/simulation/start", response_model=SimulationControlResponse)
@limiter.limit("10/minute")
async def start_simulation(
    request: Request,
    current_user: User = Depends(require_roles("admin", "manager")),
) -> SimulationControlResponse:
    started = await simulation_engine.start()
    if started:
        return SimulationControlResponse(status="running", message="Simulation started")
    return SimulationControlResponse(status="running", message="Simulation already running")


@router.post("/simulation/stop", response_model=SimulationControlResponse)
@limiter.limit("10/minute")
async def stop_simulation(
    request: Request,
    current_user: User = Depends(require_roles("admin", "manager")),
) -> SimulationControlResponse:
    stopped = await simulation_engine.stop()
    if stopped:
        return SimulationControlResponse(status="stopped", message="Simulation stopped")
    return SimulationControlResponse(status="stopped", message="Simulation already stopped")
