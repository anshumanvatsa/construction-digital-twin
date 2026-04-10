from datetime import datetime

from app.schemas.common import AppBaseModel, ORMBaseModel


class AlertResponse(ORMBaseModel):
    id: int
    worker_id: int | None
    hazard_id: int | None
    type: str
    severity: str
    message: str
    timestamp: datetime


class AlertPayload(AppBaseModel):
    id: int
    type: str
    severity: str
    timestamp: datetime
    message: str
    worker_id: int | None = None
    hazard_id: int | None = None
