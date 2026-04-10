from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.core.deps import db_session_dep
from app.core.rate_limit import limiter
from app.models.worker import Worker
from app.schemas.worker import WorkerBulkCreateRequest, WorkerCreate, WorkerResetResponse, WorkerResponse, WorkerUpdate

router = APIRouter()


@router.post("/workers/add", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_worker(
    request: Request,
    worker_in: WorkerCreate,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> WorkerResponse:
    worker = Worker(
        name=worker_in.name,
        role=worker_in.role,
        fatigue_level=worker_in.fatigue_level,
        position_x=worker_in.position.x,
        position_y=worker_in.position.y,
        status=worker_in.status,
        risk_score=0.0,
    )
    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    return WorkerResponse.model_validate(worker)


@router.put("/workers/{worker_id}", response_model=WorkerResponse)
@limiter.limit("30/minute")
async def update_worker(
    request: Request,
    worker_id: int,
    worker_in: WorkerUpdate,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> WorkerResponse:
    worker = await db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    update_data = worker_in.model_dump(exclude_unset=True)
    if "position" in update_data and update_data["position"]:
        update_data["position_x"] = update_data["position"].x
        update_data["position_y"] = update_data["position"].y
        del update_data["position"]

    for key, value in update_data.items():
        if value is not None:
            setattr(worker, key, value)

    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    return WorkerResponse.model_validate(worker)


@router.delete("/workers/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def delete_worker(
    request: Request,
    worker_id: int,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> None:
    worker = await db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    await db.delete(worker)
    await db.commit()


@router.get("/workers", response_model=list[WorkerResponse])
@limiter.limit("120/minute")
async def get_workers(request: Request, db: AsyncSession = Depends(db_session_dep)) -> list[WorkerResponse]:
    workers = list((await db.scalars(select(Worker).order_by(Worker.id.asc()))).all())
    return [WorkerResponse.model_validate(worker) for worker in workers]


@router.post("/workers/bulk", response_model=list[WorkerResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def bulk_add_workers(
    request: Request,
    payload: WorkerBulkCreateRequest,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> list[WorkerResponse]:
    created: list[Worker] = []
    for worker_in in payload.workers:
        worker = Worker(
            name=worker_in.name,
            role=worker_in.role,
            fatigue_level=worker_in.fatigue_level,
            position_x=worker_in.position.x,
            position_y=worker_in.position.y,
            status=worker_in.status,
            risk_score=0.0,
        )
        db.add(worker)
        created.append(worker)

    await db.commit()
    for worker in created:
        await db.refresh(worker)

    return [WorkerResponse.model_validate(worker) for worker in created]


@router.post("/workers/reset", response_model=WorkerResetResponse)
@limiter.limit("5/minute")
async def reset_workers(
    request: Request,
    current_user=Depends(require_roles("admin", "manager")),
    db: AsyncSession = Depends(db_session_dep),
) -> WorkerResetResponse:
    existing_workers = list((await db.scalars(select(Worker.id))).all())
    deleted_count = len(existing_workers)
    await db.execute(delete(Worker))
    await db.commit()
    return WorkerResetResponse(success=True, deleted_count=deleted_count)
