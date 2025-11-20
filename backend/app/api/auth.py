import re
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service, email_service
from app.services.logging_service import log_action
from app.core.config import settings

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    username: str


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    mfa_required: bool
    temp_token: str | None = None
    message: str


class MFAVerifyRequest(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=6, max_length=6)


class MFAVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    username: str
    expires_at: datetime


class LogoutResponse(BaseModel):
    message: str


class UserMeResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    is_active: bool


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db_session),
) -> RegisterResponse:
    """
    Register a new user with default role 'user'.
    """
    # Check if username already exists
    existing_user = db.query(models.User).filter(
        models.User.username == payload.username
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(models.User).filter(
        models.User.email == payload.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = auth_service.hash_password(payload.password)
    user = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_password,
        role="user",
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log registration
    log_action(
        user_id=user.user_id,
        role=user.role,
        action="register",
        details=f"User registered: {payload.username}",
        db=db
    )
    
    return RegisterResponse(
        message="User registered successfully",
        user_id=user.user_id,
        username=user.username
    )


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
) -> LoginResponse:
    """
    Login with username/email and password. Returns temp_token for MFA verification.
    """
    # Find user by username or email
    user = db.query(models.User).filter(
        (models.User.username == payload.username_or_email) |
        (models.User.email == payload.username_or_email)
    ).first()
    
    if not user:
        # Log failed login attempt (no user_id)
        log_action(
            user_id=None,
            role=None,
            action="login_failed",
            details=f"Failed login attempt for: {payload.username_or_email}",
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Verify password
    if not auth_service.verify_password(payload.password, user.hashed_password):
        log_action(
            user_id=user.user_id,
            role=user.role,
            action="login_failed",
            details="Invalid password",
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Generate MFA code and temp token
    mfa_code, temp_token = await auth_service.create_mfa_code(user.user_id, db)
    
    # Send MFA code via email
    email_sent = await email_service.send_mfa_code(user.email, mfa_code)
    if not email_sent and settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send MFA code. Please try again."
        )
    
    # Log MFA send
    log_action(
        user_id=user.user_id,
        role=user.role,
        action="mfa_send",
        details="MFA code sent to user email",
        db=db
    )
    
    return LoginResponse(
        mfa_required=True,
        temp_token=temp_token,
        message="MFA code sent to your email"
    )


@router.post("/mfa-verify", response_model=MFAVerifyResponse, status_code=status.HTTP_200_OK)
async def mfa_verify(
    payload: MFAVerifyRequest,
    db: Session = Depends(get_db_session),
) -> MFAVerifyResponse:
    """
    Verify MFA code and return JWT access token.
    """
    try:
        user, access_token = await auth_service.verify_mfa_and_create_session(
            payload.temp_token,
            payload.code,
            db
        )
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Log successful MFA verification and login
        log_action(
            user_id=user.user_id,
            role=user.role,
            action="mfa_verify",
            details="MFA code verified successfully",
            db=db
        )
        log_action(
            user_id=user.user_id,
            role=user.role,
            action="login",
            details="User logged in successfully",
            db=db
        )
        
        return MFAVerifyResponse(
            access_token=access_token,
            token_type="bearer",
            role=user.role,
            user_id=user.user_id,
            username=user.username,
            expires_at=expires_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MFA verification failed: {str(e)}"
        )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> LogoutResponse:
    """
    Logout user. Client should delete token from storage.
    """
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="logout",
        details="User logged out",
        db=db
    )
    
    return LogoutResponse(message=f"User {current_user.username} logged out successfully")


@router.get("/me", response_model=UserMeResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: models.User = Depends(auth_service.get_current_user),
) -> UserMeResponse:
    """
    Get current user information (role only, no PII in response).
    """
    return UserMeResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active
    )
