from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service
from app.services.logging_service import log_action

router = APIRouter()


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: str


@router.get("/", response_model=list[UserOut], status_code=status.HTTP_200_OK)
async def list_users(
    search: Optional[str] = Query(None, description="Search by username or email"),
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> list[UserOut]:
    """
    List all users. Admin only.
    Can search by username or email.
    """
    query = db.query(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.username.ilike(search_term)) |
            (models.User.email.ilike(search_term))
        )
    
    users = query.order_by(models.User.created_at.desc()).all()
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_users",
        details=f"Listed {len(users)} users" + (f" (search: {search})" if search else ""),
        db=db
    )
    
    return [UserOut.model_validate(user) for user in users]


@router.put("/{user_id}/role", response_model=UserOut, status_code=status.HTTP_200_OK)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> UserOut:
    """
    Update user role. Admin only.
    Valid roles: admin, doctor, receptionist, user
    """
    # Validate role
    valid_roles = ["admin", "doctor", "receptionist", "user"]
    if payload.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get user
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-demotion from admin (optional safety check)
    if user.user_id == current_user.user_id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role from admin"
        )
    
    old_role = user.role
    user.role = payload.role
    db.commit()
    db.refresh(user)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="update_user_role",
        details=f"Changed user {user_id} role from {old_role} to {payload.role}",
        db=db
    )
    
    return UserOut.model_validate(user)


@router.put("/{user_id}/activate", response_model=UserOut, status_code=status.HTTP_200_OK)
async def toggle_user_active(
    user_id: int,
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> UserOut:
    """
    Toggle user active status. Admin only.
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="toggle_user_active",
        details=f"Set user {user_id} active status to {user.is_active}",
        db=db
    )
    
    return UserOut.model_validate(user)
