from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service
from app.services.logging_service import log_action

router = APIRouter()


class ActivityStatsResponse(BaseModel):
    """Activity statistics for charts"""
    days: list[str]  # Date labels
    actions_per_day: list[int]  # Count of actions per day
    actions_by_role: dict[str, int]  # Actions grouped by role
    actions_by_type: dict[str, int]  # Actions grouped by action type


class RetentionSettings(BaseModel):
    retention_days: int = Field(..., ge=1, le=365, description="Number of days to retain logs")
    enabled: bool = Field(True, description="Whether retention is enabled")


class RetentionSettingsResponse(BaseModel):
    retention_days: int
    enabled: bool
    next_purge_date: Optional[datetime] = None
    logs_to_delete: int = 0


class RetentionUpdate(BaseModel):
    retention_days: int = Field(..., ge=1, le=365)
    enabled: bool = True


class ConsentStatsResponse(BaseModel):
    total_users: int
    consented_users: int
    consent_percentage: float
    last_updated: datetime


@router.get("/stats/activity", response_model=ActivityStatsResponse)
async def get_activity_stats(
    days: int = Query(7, ge=1, le=30, description="Number of days to analyze (7 or 30)"),
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> ActivityStatsResponse:
    """
    Get real-time activity statistics for charts.
    Admin only. Returns anonymized data (no PII).
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get logs in date range
    logs = db.query(models.Log).filter(
        and_(
            models.Log.timestamp >= start_date,
            models.Log.timestamp <= end_date
        )
    ).all()
    
    # Group by day
    actions_per_day_dict = defaultdict(int)
    actions_by_role_dict = defaultdict(int)
    actions_by_type_dict = defaultdict(int)
    
    for log in logs:
        # Group by day
        day_key = log.timestamp.strftime("%Y-%m-%d")
        actions_per_day_dict[day_key] += 1
        
        # Group by role
        role = log.role or "unknown"
        actions_by_role_dict[role] += 1
        
        # Group by action type
        action_type = log.action.split("_")[0] if "_" in log.action else log.action
        actions_by_type_dict[action_type] += 1
    
    # Generate day labels for the period
    days_list = []
    actions_count_list = []
    current = start_date
    while current <= end_date:
        day_str = current.strftime("%Y-%m-%d")
        days_list.append(day_str)
        actions_count_list.append(actions_per_day_dict[day_str])
        current += timedelta(days=1)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_stats",
        details=f"Viewed activity stats for last {days} days",
        db=db
    )
    
    return ActivityStatsResponse(
        days=days_list,
        actions_per_day=actions_count_list,
        actions_by_role=dict(actions_by_role_dict),
        actions_by_type=dict(actions_by_type_dict)
    )


@router.get("/admin/retention", response_model=RetentionSettingsResponse)
async def get_retention_settings(
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> RetentionSettingsResponse:
    """
    Get current data retention settings and next purge info.
    Admin only.
    """
    # Get retention settings from config or database
    # For now, we'll use a simple approach with a settings table
    # In production, this should be in a dedicated settings table
    from app.core.config import settings
    
    # Default retention (could be stored in DB)
    retention_days = 90  # Default
    enabled = True
    
    # Calculate next purge date
    next_purge_date = None
    logs_to_delete = 0
    
    if enabled:
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        logs_to_delete = db.query(models.Log).filter(
            models.Log.timestamp < cutoff_date
        ).count()
        
        # Next purge would be scheduled (e.g., daily at midnight)
        # For now, show when oldest log would be purged
        oldest_log = db.query(models.Log).order_by(models.Log.timestamp.asc()).first()
        if oldest_log and oldest_log.timestamp < cutoff_date:
            next_purge_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        elif oldest_log:
            # When the oldest log will expire
            next_purge_date = oldest_log.timestamp + timedelta(days=retention_days)
    
    return RetentionSettingsResponse(
        retention_days=retention_days,
        enabled=enabled,
        next_purge_date=next_purge_date,
        logs_to_delete=logs_to_delete
    )


@router.post("/admin/retention", response_model=RetentionSettingsResponse)
async def update_retention_settings(
    payload: RetentionUpdate,
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> RetentionSettingsResponse:
    """
    Update data retention settings.
    Admin only. This will trigger a cleanup job.
    """
    retention_days = payload.retention_days
    enabled = payload.enabled
    
    # In production, store this in a settings table
    # For now, we'll apply it immediately
    
    if enabled:
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        deleted_count = db.query(models.Log).filter(
            models.Log.timestamp < cutoff_date
        ).delete()
        db.commit()
        
        log_action(
            user_id=current_user.user_id,
            role=current_user.role,
            action="update_retention",
            details=f"Updated retention to {retention_days} days, deleted {deleted_count} old logs",
            db=db
        )
    else:
        deleted_count = 0
        log_action(
            user_id=current_user.user_id,
            role=current_user.role,
            action="update_retention",
            details=f"Disabled retention policy",
            db=db
        )
    
    # Calculate next purge
    next_purge_date = None
    logs_to_delete = 0
    
    if enabled:
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        logs_to_delete = db.query(models.Log).filter(
            models.Log.timestamp < cutoff_date
        ).count()
        
        oldest_log = db.query(models.Log).order_by(models.Log.timestamp.asc()).first()
        if oldest_log:
            next_purge_date = oldest_log.timestamp + timedelta(days=retention_days)
    
    return RetentionSettingsResponse(
        retention_days=retention_days,
        enabled=enabled,
        next_purge_date=next_purge_date,
        logs_to_delete=logs_to_delete
    )


@router.get("/admin/consent-stats", response_model=ConsentStatsResponse)
async def get_consent_stats(
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> ConsentStatsResponse:
    """
    Get GDPR consent statistics.
    Shows percentage of users who have consented to data processing.
    Admin only.
    """
    # Get total active users
    total_users = db.query(models.User).filter(models.User.is_active == True).count()
    
    # Query users with GDPR consent
    consented_users = db.query(models.User).filter(
        and_(
            models.User.is_active == True,
            models.User.gdpr_consent == True
        )
    ).count()
    
    consent_percentage = (consented_users / total_users * 100) if total_users > 0 else 0.0
    
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_consent_stats",
        details=f"Viewed consent statistics",
        db=db
    )
    
    return ConsentStatsResponse(
        total_users=total_users,
        consented_users=consented_users,
        consent_percentage=round(consent_percentage, 2),
        last_updated=datetime.utcnow()
    )

