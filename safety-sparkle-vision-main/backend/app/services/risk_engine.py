from math import dist

from app.core.settings import get_settings
from app.models.hazard import Hazard
from app.models.worker import Worker

settings = get_settings()


def risk_level_from_score(score: float) -> str:
    if score >= settings.risk_high_threshold:
        return "HIGH"
    if score >= settings.risk_medium_threshold:
        return "MEDIUM"
    return "LOW"


def compute_worker_risk(
    worker: Worker,
    hazards: list[Hazard],
    exposure_seconds_by_hazard: dict[int, float],
) -> tuple[float, str, list[Hazard]]:
    if not hazards:
        return 0.0, "LOW", []

    fatigue_component = min(100.0, worker.fatigue_level) * 0.35
    max_hazard_component = 0.0
    nearby_hazards: list[Hazard] = []

    for hazard in hazards:
        distance = dist([worker.position_x, worker.position_y], [hazard.center_x, hazard.center_y])
        hazard_reach = hazard.radius or 10.0
        proximity_factor = max(0.0, 1.0 - (distance / max(hazard_reach * 2.0, 1.0)))
        severity_factor = (hazard.severity / 10.0)
        exposure_seconds = exposure_seconds_by_hazard.get(hazard.id, 0.0)
        exposure_factor = min(1.0, exposure_seconds / 300.0)

        hazard_component = 100.0 * ((0.45 * proximity_factor) + (0.35 * severity_factor) + (0.20 * exposure_factor))

        if distance <= hazard_reach:
            nearby_hazards.append(hazard)

        max_hazard_component = max(max_hazard_component, hazard_component)

    risk_score = round(min(100.0, fatigue_component + (0.65 * max_hazard_component)), 2)
    return risk_score, risk_level_from_score(risk_score), nearby_hazards
