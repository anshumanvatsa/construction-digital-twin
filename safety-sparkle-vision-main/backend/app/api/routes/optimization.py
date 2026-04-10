from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import db_session_dep
from app.core.rate_limit import limiter
from app.models.hazard import Hazard
from app.services.optimization_engine import OptimizationEngine

router = APIRouter(prefix="/optimization")
optimizer = OptimizationEngine()


@router.get("/safer-route")
@limiter.limit("40/minute")
async def safer_route(
    request: Request,
    start_x: int = Query(..., ge=0, le=99),
    start_y: int = Query(..., ge=0, le=99),
    end_x: int = Query(..., ge=0, le=99),
    end_y: int = Query(..., ge=0, le=99),
    db: AsyncSession = Depends(db_session_dep),
) -> dict:
    hazards = list((await db.scalars(select(Hazard))).all())
    path = optimizer.safer_route((start_x, start_y), (end_x, end_y), hazards)
    congestion_score = max(0, 100 - len(path)) if path else 100

    return {
        "start": {"x": start_x, "y": start_y},
        "end": {"x": end_x, "y": end_y},
        "path": [{"x": x, "y": y} for x, y in path],
        "congestion_score": congestion_score,
        "recommended": bool(path),
    }
