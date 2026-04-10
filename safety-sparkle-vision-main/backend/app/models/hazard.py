from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Float, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.event import Event


class Hazard(Base, TimestampMixin):
    __tablename__ = "hazards"
    __table_args__ = (
        Index("ix_hazards_type", "type"),
        Index("ix_hazards_severity", "severity"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(60), nullable=False)
    severity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    center_x: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    center_y: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    radius: Mapped[float | None] = mapped_column(Float, nullable=True)
    polygon: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    active_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    alerts: Mapped[list["Alert"]] = relationship(back_populates="hazard")
    events: Mapped[list["Event"]] = relationship(back_populates="hazard")
