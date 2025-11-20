from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import auth, export, logs, patients, users
from app.core.config import settings
from app.db.session import get_db_session
from app.services.logging_service import audit_logger

try:
    from scripts.init_db import initialize_database
except ModuleNotFoundError:  # pragma: no cover - fallback for package imports
    from backend.scripts.init_db import initialize_database  # type: ignore


def run_db_initialization() -> None:
    """Execute the DB init script if the SQLite file is missing."""
    db_file = Path(settings.DB_PATH)
    if db_file.exists():
        return

    initialize_database()


app = FastAPI(
    title="Hospital CIA Dashboard API",
    version="0.1.0",
    description="Skeleton API for GDPR-friendly hospital management workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    """Stub middleware showing where request/response audit logging should occur."""
    # TODO: Replace with structured logging that excludes PHI and sensitive data.
    audit_logger.debug("Request received", extra={"path": request.url.path, "method": request.method})
    response = await call_next(request)
    audit_logger.debug(
        "Response sent",
        extra={"status_code": response.status_code, "path": request.url.path},
    )
    return response


@app.on_event("startup")
async def startup_event() -> None:
    run_db_initialization()
    # Set server start time
    settings.SERVER_START_TIME = datetime.utcnow()


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    return {"message": "Hospital CIA Dashboard API is running", "status": "ok"}


@app.get("/api/health", tags=["health"])
async def health_check(db: Session = Depends(get_db_session)) -> dict:
    """
    Health check endpoint. Returns system status and database connectivity.
    """
    db_ok = False
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    
    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/meta", tags=["meta"])
async def get_meta() -> dict:
    """
    Get system metadata: uptime and last sync time.
    """
    uptime_seconds = None
    if settings.SERVER_START_TIME:
        uptime_seconds = int((datetime.utcnow() - settings.SERVER_START_TIME).total_seconds())
    
    return {
        "server_start_time": settings.SERVER_START_TIME.isoformat() if settings.SERVER_START_TIME else None,
        "uptime_seconds": uptime_seconds,
        "last_sync_time": settings.LAST_SYNC_TIME.isoformat() if settings.LAST_SYNC_TIME else None,
        "timestamp": datetime.utcnow().isoformat()
    }


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

