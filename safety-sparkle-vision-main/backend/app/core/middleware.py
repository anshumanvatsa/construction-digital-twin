import time
import uuid

from fastapi import FastAPI, Request
import structlog

logger = structlog.get_logger(__name__)


def setup_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        logger.info(
            "request_started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=client_ip,
            user_agent=user_agent,
            query_params=str(request.query_params),
        )

        try:
            response = await call_next(request)
        except Exception:
            elapsed = time.perf_counter() - start_time
            logger.exception(
                "request_failed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                client_ip=client_ip,
                duration_ms=round(elapsed * 1000, 2),
            )
            raise

        elapsed = time.perf_counter() - start_time
        response.headers["x-request-id"] = request_id
        response.headers["x-process-time-ms"] = str(round(elapsed * 1000, 2))

        log_method = logger.warning if response.status_code >= 400 else logger.info
        log_method(
            "request_completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=client_ip,
            status_code=response.status_code,
            duration_ms=round(elapsed * 1000, 2),
        )
        return response
