from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service
from app.services.logging_service import log_action

router = APIRouter()


class LogEntry(BaseModel):
    log_id: int
    user_id: int | None
    role: str | None
    action: str
    timestamp: datetime
    details: str | None

    class Config:
        from_attributes = True


class LogsResponse(BaseModel):
    logs: list[LogEntry]
    total: int
    page: int
    page_size: int


@router.get("/", response_model=LogsResponse)
async def list_logs(
    role: Optional[str] = Query(None, description="Filter by role"),
    user_id: Optional[int] = Query(None, description="Filter by user_id"),
    action: Optional[str] = Query(None, description="Filter by action"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> LogsResponse:
    """
    List audit logs with filtering and pagination. Admin only.
    """
    query = db.query(models.Log)
    
    # Apply filters
    if role:
        query = query.filter(models.Log.role == role)
    if user_id:
        query = query.filter(models.Log.user_id == user_id)
    if action:
        query = query.filter(models.Log.action.ilike(f"%{action}%"))
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(models.Log.timestamp >= date_from_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d")
            # Include entire day
            date_to_obj = date_to_obj.replace(hour=23, minute=59, second=59)
            query = query.filter(models.Log.timestamp <= date_to_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    logs = query.order_by(models.Log.timestamp.desc()).offset(offset).limit(page_size).all()
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_logs",
        details=f"Viewed logs page {page} (filters: role={role}, user_id={user_id}, action={action})",
        db=db
    )
    
    return LogsResponse(
        logs=[LogEntry.from_orm(entry) for entry in logs],
        total=total,
        page=page,
        page_size=page_size
    )
