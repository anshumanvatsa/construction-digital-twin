from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import db_session_dep
from app.core.rate_limit import limiter
from app.models.alert import Alert
from app.models.hazard import Hazard
from app.models.worker import Worker
from app.schemas.analytics import DangerZoneItem, RiskTrendPoint, WorkerRankingItem

router = APIRouter(prefix="/analytics")


@router.get("/risk-trends", response_model=list[RiskTrendPoint])
@limiter.limit("60/minute")
async def risk_trends(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[RiskTrendPoint]:
    rows = (
        (
            await db.execute(
                select(
                    func.to_char(func.date_trunc("hour", Alert.timestamp), "YYYY-MM-DD HH24:00").label("period"),
                    func.avg(Worker.risk_score).label("avg_risk"),
                )
                .join(Worker, Worker.id == Alert.worker_id, isouter=True)
                .group_by(func.date_trunc("hour", Alert.timestamp))
                .order_by(func.date_trunc("hour", Alert.timestamp))
                .limit(48)
            )
        )
        .mappings()
        .all()
    )
    return [RiskTrendPoint(period=row["period"], avg_risk=float(row["avg_risk"] or 0.0)) for row in rows]


@router.get("/danger-zones", response_model=list[DangerZoneItem])
@limiter.limit("60/minute")
async def danger_zones(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[DangerZoneItem]:
    rows = (
        (
            await db.execute(
                select(
                    Hazard.id.label("hazard_id"),
                    Hazard.type.label("hazard_type"),
                    Hazard.severity,
                    func.count(Alert.id).label("alert_count"),
                )
                .join(Alert, Alert.hazard_id == Hazard.id, isouter=True)
                .group_by(Hazard.id)
                .order_by(func.count(Alert.id).desc(), Hazard.severity.desc())
            )
        )
        .mappings()
        .all()
    )

    return [
        DangerZoneItem(
            hazard_id=row["hazard_id"],
            hazard_type=row["hazard_type"],
            severity=row["severity"],
            alert_count=row["alert_count"],
        )
        for row in rows
    ]


@router.get("/worker-ranking", response_model=list[WorkerRankingItem])
@limiter.limit("60/minute")
async def worker_ranking(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[WorkerRankingItem]:
    workers = list((await db.scalars(select(Worker).order_by(Worker.risk_score.desc(), Worker.fatigue_level.desc()))).all())

    return [
        WorkerRankingItem(
            worker_id=worker.id,
            worker_name=worker.name,
            role=worker.role,
            risk_score=worker.risk_score,
            fatigue_level=worker.fatigue_level,
        )
        for worker in workers
    ]
