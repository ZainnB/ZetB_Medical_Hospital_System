import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.db import models
from app.services.email_service import send_mfa_code
from app.services.logging_service import log_action

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT security
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using pbkdf2_sha256."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def create_temp_token() -> str:
    """Create a temporary token for MFA flow."""
    return secrets.token_urlsafe(32)


def hash_mfa_code(code: str) -> str:
    """Hash MFA code using SHA256."""
    return hashlib.sha256(code.encode()).hexdigest()


def verify_mfa_code(code: str, hashed_code: str) -> bool:
    """Verify MFA code against its hash."""
    return hash_mfa_code(code) == hashed_code


def generate_mfa_code() -> str:
    """Generate a 6-digit MFA code."""
    return f"{secrets.randbelow(1000000):06d}"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session),
) -> models.User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


def require_role(*allowed_roles: str):
    """Dependency factory to require specific roles."""
    def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


async def create_mfa_code(user_id: int, db: Session) -> tuple[str, str]:
    """
    Create and store MFA code for user.
    Returns (mfa_code, temp_token).
    """
    # Clean up expired codes
    db.query(models.MFACode).filter(
        models.MFACode.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
    
    # Generate code and token
    mfa_code = generate_mfa_code()
    temp_token = create_temp_token()
    hashed_code = hash_mfa_code(mfa_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.MFA_CODE_EXPIRE_MINUTES)
    
    # Store in database
    mfa_record = models.MFACode(
        user_id=user_id,
        hashed_code=hashed_code,
        temp_token=temp_token,
        expires_at=expires_at,
        used=False
    )
    db.add(mfa_record)
    db.commit()
    db.refresh(mfa_record)
    
    return mfa_code, temp_token


async def verify_mfa_and_create_session(
    temp_token: str,
    code: str,
    db: Session
) -> tuple[models.User, str]:
    """
    Verify MFA code and create JWT session.
    Returns (user, access_token).
    """
    mfa_record = db.query(models.MFACode).filter(
        models.MFACode.temp_token == temp_token,
        models.MFACode.used == False
    ).first()
    
    if not mfa_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired MFA token"
        )
    
    if mfa_record.expires_at < datetime.utcnow():
        mfa_record.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA code has expired"
        )
    
    if not verify_mfa_code(code, mfa_record.hashed_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code"
        )
    
    # Mark code as used
    mfa_record.used = True
    db.commit()
    
    # Get user
    user = db.query(models.User).filter(models.User.user_id == mfa_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user.user_id, "role": user.role})
    
    return user, access_token


# Legacy stub for backward compatibility (will be removed)
def get_current_user_stub(_: Any = Depends(get_db_session)) -> dict[str, Any]:
    """Legacy stub - use get_current_user instead."""
    return {"user_id": 1, "username": "admin", "role": "admin"}


def get_role_for_user(username: str) -> str | None:
    """Get role for user by username."""
    from app.db.session import session_scope
    with session_scope() as session:
        user = session.query(models.User).filter(models.User.username == username).first()
        return user.role if user else None


def generate_mock_token(*, username: str) -> str:
    """Legacy mock token generator - use create_access_token instead."""
    return f"{username}-{secrets.token_urlsafe(16)}"
