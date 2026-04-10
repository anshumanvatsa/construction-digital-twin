from app.schemas.common import AppBaseModel


class RiskTrendPoint(AppBaseModel):
    period: str
    avg_risk: float


class DangerZoneItem(AppBaseModel):
    hazard_id: int
    hazard_type: str
    severity: int
    alert_count: int


class WorkerRankingItem(AppBaseModel):
    worker_id: int
    worker_name: str
    role: str
    risk_score: float
    fatigue_level: float
