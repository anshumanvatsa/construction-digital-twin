from fastapi import APIRouter

from app.api.routes import alerts, analytics, auth, hazards, optimization, simulation, workers

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(simulation.router, tags=["simulation"])
api_router.include_router(workers.router, tags=["workers"])
api_router.include_router(hazards.router, tags=["hazards"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(optimization.router, tags=["optimization"])
