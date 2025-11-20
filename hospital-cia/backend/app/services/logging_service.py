import logging
from pathlib import Path
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import models
from app.db.session import session_scope

BACKEND_DIR = Path(__file__).resolve().parents[2]
logs_dir = BACKEND_DIR / "logs"
logs_dir.mkdir(parents=True, exist_ok=True)

audit_logger = logging.getLogger("hospital_cia.audit")
audit_logger.setLevel(logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO)

handler = logging.FileHandler(logs_dir / "audit.log")
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

if not audit_logger.handlers:
    audit_logger.addHandler(handler)


def log_action(
    *,
    user_id: Optional[int] = None,
    role: Optional[str] = None,
    action: str,
    details: Optional[str] = None,
    db: Optional[Session] = None
) -> None:
    """
    Persist structured logs to database and file logger.
    Do NOT log PII in details field.
    """
    # Log to file
    audit_logger.info(
        "action performed",
        extra={"user_id": user_id, "role": role, "action": action, "details": details},
    )
    
    # Persist to database
    try:
        if db:
            # Use provided session
            log_entry = models.Log(
                user_id=user_id,
                role=role,
                action=action,
                details=details,
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        else:
            # Create new session
            with session_scope() as session:
                log_entry = models.Log(
                    user_id=user_id,
                    role=role,
                    action=action,
                    details=details,
                    timestamp=datetime.utcnow()
                )
                session.add(log_entry)
                session.commit()
    except Exception as e:
        audit_logger.error(f"Failed to persist log to database: {str(e)}")

