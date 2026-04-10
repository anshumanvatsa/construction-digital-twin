from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.core.deps import db_session_dep
from app.core.rate_limit import limiter
from app.models.hazard import Hazard
from app.schemas.hazard import HazardCreate, HazardResponse

router = APIRouter()


@router.post("/hazards", response_model=HazardResponse)
@limiter.limit("20/minute")
async def add_hazard(
    request: Request,
    hazard_in: HazardCreate,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> HazardResponse:
    hazard = Hazard(
        type=hazard_in.type,
        severity=hazard_in.severity,
        center_x=hazard_in.center_x,
        center_y=hazard_in.center_y,
        radius=hazard_in.radius,
        polygon=hazard_in.polygon,
        active_time=hazard_in.active_time,
    )
    db.add(hazard)
    await db.commit()
    await db.refresh(hazard)
    return HazardResponse.model_validate(hazard)


@router.get("/hazards", response_model=list[HazardResponse])
@limiter.limit("120/minute")
async def get_hazards(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[HazardResponse]:
    now = datetime.now(timezone.utc)
    hazards = list((await db.scalars(select(Hazard).where(Hazard.active_time <= now).order_by(Hazard.id.asc()))).all())
    return [HazardResponse.model_validate(hazard) for hazard in hazards]
