from typing import TYPE_CHECKING

from sqlalchemy import Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.event import Event


class Worker(Base, TimestampMixin):
    __tablename__ = "workers"
    __table_args__ = (
        Index("ix_workers_status", "status"),
        Index("ix_workers_role", "role"),
        Index("ix_workers_risk_score", "risk_score"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(80), nullable=False)
    fatigue_level: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    position_x: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    position_y: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)

    alerts: Mapped[list["Alert"]] = relationship(back_populates="worker")
    events: Mapped[list["Event"]] = relationship(back_populates="worker")
