from datetime import datetime

from app.schemas.common import AppBaseModel


class SimulationControlResponse(AppBaseModel):
    status: str
    message: str


class SimulationEnvelope(AppBaseModel):
    event: str
    timestamp: datetime
    payload: dict
