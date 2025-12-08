"""
Background service for automatic log retention cleanup.
Run this as a scheduled task (cron job or background worker).
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import session_scope
from app.db import models


def cleanup_old_logs(retention_days: int = 90) -> int:
    """
    Delete logs older than retention_days.
    Returns the number of logs deleted.
    
    This should be run as a scheduled background task (e.g., daily at midnight).
    """
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    
    with session_scope() as db:
        deleted_count = db.query(models.Log).filter(
            models.Log.timestamp < cutoff_date
        ).delete()
        db.commit()
        
        return deleted_count


def run_retention_cleanup():
    """
    Main entry point for scheduled retention cleanup.
    Configure this to run daily via:
    - Cron job
    - Celery scheduled task
    - APScheduler
    - Systemd timer
    """
    retention_days = 90  # Default, could be loaded from settings table
    deleted = cleanup_old_logs(retention_days)
    
    print(f"[RETENTION] Cleaned up {deleted} logs older than {retention_days} days")
    return deleted


if __name__ == "__main__":
    # For manual testing or direct execution
    run_retention_cleanup()

