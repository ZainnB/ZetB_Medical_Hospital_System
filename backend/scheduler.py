"""
Scheduler for background tasks like log retention cleanup.
Run this as a separate process or use it with a task queue.

Usage:
    python -m backend.scheduler
"""
import time
import schedule
from app.services.retention_service import run_retention_cleanup


def run_scheduler():
    """Run the scheduler in a loop."""
    # Schedule retention cleanup daily at 2 AM
    schedule.every().day.at("02:00").do(run_retention_cleanup)
    
    print("[SCHEDULER] Background scheduler started")
    print("[SCHEDULER] Retention cleanup scheduled for 02:00 daily")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    run_scheduler()

