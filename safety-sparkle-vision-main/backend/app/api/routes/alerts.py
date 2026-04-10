from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import db_session_dep
from app.core.rate_limit import limiter
from app.models.alert import Alert
from app.schemas.alert import AlertResponse

router = APIRouter()


@router.get("/alerts", response_model=list[AlertResponse])
@limiter.limit("120/minute")
async def get_alerts(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[AlertResponse]:
    alerts = list((await db.scalars(select(Alert).order_by(Alert.timestamp.desc()).limit(200))).all())
    return [AlertResponse.model_validate(alert) for alert in alerts]
