from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True, extra="forbid")


class ORMBaseModel(AppBaseModel):
    pass


class Position(AppBaseModel):
    x: float = Field(ge=0.0, le=100.0)
    y: float = Field(ge=0.0, le=100.0)


class TimestampedResponse(ORMBaseModel):
    created_at: datetime
    updated_at: datetime
