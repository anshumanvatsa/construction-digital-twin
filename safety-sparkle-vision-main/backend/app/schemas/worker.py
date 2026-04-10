from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import AppBaseModel, ORMBaseModel, Position


class WorkerCreate(AppBaseModel):
    name: str = Field(min_length=2, max_length=120)
    role: str = Field(min_length=2, max_length=80)
    fatigue_level: float = Field(default=0.0, ge=0.0, le=100.0)
    position: Position
    status: str = Field(default="active", max_length=40)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"active", "inactive", "on_break"}
        normalized = value.lower()
        if normalized not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return normalized

    @field_validator("name", "role")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        if any(ch in value for ch in ("\n", "\r", "\t")):
            raise ValueError("field contains invalid control characters")
        return value


class WorkerUpdate(AppBaseModel):
    fatigue_level: float | None = Field(default=None, ge=0.0, le=100.0)
    risk_score: float | None = None
    position: Position | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_optional_status(cls, value: str | None) -> str | None:
        if value is None:
            return None
        allowed = {"active", "inactive", "on_break"}
        normalized = value.lower()
        if normalized not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return normalized


class WorkerResponse(ORMBaseModel):
    id: int
    name: str
    role: str
    fatigue_level: float
    risk_score: float
    position_x: float
    position_y: float
    status: str
    created_at: datetime
    updated_at: datetime


class WorkerBulkCreateRequest(AppBaseModel):
    workers: list[WorkerCreate] = Field(min_length=1, max_length=200)


class WorkerResetResponse(AppBaseModel):
    success: bool
    deleted_count: int
