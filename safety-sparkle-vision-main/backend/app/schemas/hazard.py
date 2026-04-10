from datetime import datetime
from typing import Any

from pydantic import Field, field_validator

from app.schemas.common import AppBaseModel, ORMBaseModel


class HazardCreate(AppBaseModel):
    type: str = Field(min_length=2, max_length=60)
    severity: int = Field(ge=1, le=10)
    center_x: float
    center_y: float
    radius: float | None = Field(default=None, gt=0)
    polygon: list[dict[str, Any]] | None = None
    active_time: datetime

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if any(ch in value for ch in ("\n", "\r", "\t")):
            raise ValueError("hazard type contains invalid control characters")
        return value.lower()


class HazardResponse(ORMBaseModel):
    id: int
    type: str
    severity: int
    center_x: float
    center_y: float
    radius: float | None
    polygon: list[dict[str, Any]] | None
    active_time: datetime
    created_at: datetime
    updated_at: datetime
