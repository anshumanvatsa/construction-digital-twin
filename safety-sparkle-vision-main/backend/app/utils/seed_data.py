from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.settings import get_settings
from app.models.alert import Alert
from app.models.hazard import Hazard
from app.models.user import User
from app.models.worker import Worker

settings = get_settings()


async def seed_initial_data(db: AsyncSession) -> None:
    user_count = await db.scalar(select(func.count(User.id)))
    worker_count = await db.scalar(select(func.count(Worker.id)))
    hazard_count = await db.scalar(select(func.count(Hazard.id)))

    if not user_count:
        db.add(
            User(
                username="admin",
                email=settings.default_admin_email,
                hashed_password=hash_password(settings.default_admin_password),
                is_active=True,
                is_admin=True,
                role="admin",
            )
        )

    if not worker_count:
        db.add_all(
            [
                Worker(name="Arun Patel", role="Electrician", fatigue_level=22.0, position_x=10, position_y=18, status="active"),
                Worker(name="Maya Singh", role="Crane Operator", fatigue_level=35.0, position_x=32, position_y=42, status="active"),
                Worker(name="Ravi Kumar", role="Supervisor", fatigue_level=18.0, position_x=54, position_y=26, status="active"),
                Worker(name="Asha Verma", role="Rigger", fatigue_level=28.0, position_x=66, position_y=70, status="active"),
                Worker(name="Imran Khan", role="Welder", fatigue_level=31.0, position_x=20, position_y=66, status="active"),
                Worker(name="Neha Joshi", role="Forklift Operator", fatigue_level=26.0, position_x=45, position_y=12, status="active"),
                Worker(name="Vikram Rao", role="Mason", fatigue_level=40.0, position_x=74, position_y=30, status="active"),
                Worker(name="Sara Thomas", role="Inspector", fatigue_level=15.0, position_x=83, position_y=54, status="active"),
                Worker(name="Karan Mehta", role="Helper", fatigue_level=49.0, position_x=12, position_y=82, status="active"),
                Worker(name="Pooja Nair", role="Supervisor", fatigue_level=20.0, position_x=59, position_y=61, status="active"),
            ]
        )

    if not hazard_count:
        now = datetime.now(timezone.utc)
        db.add_all(
            [
                Hazard(type="crane", severity=8, center_x=30, center_y=40, radius=12, polygon=None, active_time=now),
                Hazard(type="restricted", severity=6, center_x=68, center_y=68, radius=10, polygon=None, active_time=now),
                Hazard(type="falling", severity=9, center_x=14, center_y=22, radius=8, polygon=None, active_time=now),
            ]
        )

    await db.commit()

    if not await db.scalar(select(func.count(Alert.id))):
        workers = list((await db.scalars(select(Worker).order_by(Worker.id.asc()))).all())
        hazards = list((await db.scalars(select(Hazard).order_by(Hazard.id.asc()))).all())
        if workers and hazards:
            db.add_all(
                [
                    Alert(worker_id=workers[0].id, hazard_id=hazards[0].id, type="proximity_warning", severity="MEDIUM", message="Worker near crane hazard"),
                    Alert(worker_id=workers[1].id, hazard_id=hazards[1].id, type="zone_violation", severity="HIGH", message="Worker entered restricted zone"),
                    Alert(worker_id=workers[2].id, hazard_id=hazards[2].id, type="fall_risk", severity="HIGH", message="Possible falling object exposure"),
                ]
            )
            await db.commit()
