from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.event import Event
from app.models.hazard import Hazard
from app.models.worker import Worker


async def create_alert(
    db: AsyncSession,
    worker: Worker | None,
    hazard: Hazard | None,
    alert_type: str,
    severity: str,
    message: str,
) -> Alert:
    alert = Alert(
        worker_id=worker.id if worker else None,
        hazard_id=hazard.id if hazard else None,
        type=alert_type,
        severity=severity,
        message=message,
    )
    db.add(alert)

    event = Event(
        worker_id=worker.id if worker else None,
        hazard_id=hazard.id if hazard else None,
        event_type="alert_triggered",
        details={
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.add(event)

    await db.flush()
    return alert
