# Construction Site Digital Twin Backend

Production-grade FastAPI backend for real-time construction-site simulation, safety intelligence, analytics, and optimization.

## Stack

- FastAPI (async)
- WebSockets (`/ws/simulation`)
- PostgreSQL + SQLAlchemy ORM (async)
- Redis (state cache + pub/sub)
- Alembic migrations
- Structured logging (`structlog`)
- Rate limiting (`slowapi`)

## Project Structure

```text
backend/
  app/
    main.py
    core/
    models/
    schemas/
    api/
    services/
    websocket/
    utils/
  migrations/
  requirements.txt
  docker-compose.yml
```

## Features

- Real-time simulation loop updates workers, fatigue, risk, and movement.
- Risk engine computes dynamic risk using fatigue, hazard severity, distance, and exposure.
- Alert engine persists critical safety alerts and events.
- Redis pub/sub broadcasts simulation updates for horizontal WebSocket scaling.
- Analytics endpoints:
  - `GET /analytics/risk-trends`
  - `GET /analytics/danger-zones`
  - `GET /analytics/worker-ranking`
- Required API endpoints:
  - `POST /simulation/start`
  - `POST /simulation/stop`
  - `POST /workers/add`
  - `DELETE /workers/{id}`
  - `GET /workers`
  - `GET /hazards`
  - `GET /alerts`
- Auth endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
- Optimization endpoint:
  - `GET /optimization/safer-route`

## Run with Docker

1. Copy env values if needed:
   - `.env.example` -> `.env`
2. Start services:

```bash
docker compose up --build
```

3. Backend available at:
   - `http://localhost:8000`
   - Swagger: `http://localhost:8000/docs`

## Required Startup Flow

1. `docker-compose up --build`
2. Run migrations:

```bash
alembic upgrade head
```

3. Start backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Local Dev (without Docker)

1. Create virtualenv and install deps:

```bash
pip install -r requirements.txt
```

2. Ensure PostgreSQL and Redis are running.
3. Set env variables from `.env.example`.
4. Run migrations:

```bash
alembic upgrade head
```

5. Start app:

```bash
uvicorn app.main:app --reload --port 8000
```

## WebSocket

- Endpoint: `ws://localhost:8000/ws/simulation`
- Messages are JSON envelopes:

```json
{
  "event": "simulation_tick",
  "timestamp": "2026-04-09T12:00:00+00:00",
  "payload": {
    "workers": [],
    "hazards": [],
    "alerts": []
  }
}
```

## Seed Data

Automatic seed data runs on startup when:
- `AUTO_SEED_DATA=true`

Initial workers and hazards are injected for immediate simulation.

## Production Notes

- Disable `AUTO_CREATE_TABLES` in production and rely on Alembic.
- Run behind reverse proxy (Nginx/Traefik) with TLS.
- Move secrets to secure secret manager.
- Tune `RATE_LIMIT_DEFAULT` and DB pool settings by workload.
