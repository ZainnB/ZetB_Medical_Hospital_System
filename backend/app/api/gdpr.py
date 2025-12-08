from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service
from app.services.logging_service import log_action

router = APIRouter()


class ConsentStatusResponse(BaseModel):
    has_consented: bool
    consent_date: datetime | None = None


class ConsentAcceptRequest(BaseModel):
    accepted: bool = True


class ConsentAcceptResponse(BaseModel):
    success: bool
    message: str
    has_consented: bool


@router.get("/consent/status", response_model=ConsentStatusResponse)
async def get_consent_status(
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> ConsentStatusResponse:
    """
    Get current user's GDPR consent status.
    Requires authentication.
    """
    return ConsentStatusResponse(
        has_consented=current_user.gdpr_consent,
        consent_date=current_user.gdpr_consent_date
    )


@router.post("/consent/accept", response_model=ConsentAcceptResponse)
async def accept_consent(
    payload: ConsentAcceptRequest,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> ConsentAcceptResponse:
    """
    Accept or withdraw GDPR consent.
    Requires authentication.
    """
    current_user.gdpr_consent = payload.accepted
    if payload.accepted:
        current_user.gdpr_consent_date = datetime.utcnow()
    else:
        current_user.gdpr_consent_date = None
    
    db.commit()
    
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="update_gdpr_consent",
        details=f"GDPR consent set to {payload.accepted}",
        db=db
    )
    
    return ConsentAcceptResponse(
        success=True,
        message="Consent accepted" if payload.accepted else "Consent withdrawn",
        has_consented=current_user.gdpr_consent
    )


# Legacy endpoints for backward compatibility (deprecated)
class ConsentRequest(BaseModel):
    consent: bool


class ConsentResponse(BaseModel):
    success: bool
    message: str


@router.post("/gdpr/consent", response_model=ConsentResponse)
async def update_consent_legacy(
    payload: ConsentRequest,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> ConsentResponse:
    """
    Legacy endpoint - use /api/consent/accept instead.
    Update user's GDPR consent status.
    """
    current_user.gdpr_consent = payload.consent
    if payload.consent:
        current_user.gdpr_consent_date = datetime.utcnow()
    else:
        current_user.gdpr_consent_date = None
    
    db.commit()
    
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="update_gdpr_consent",
        details=f"GDPR consent set to {payload.consent}",
        db=db
    )
    
    return ConsentResponse(
        success=True,
        message="Consent updated successfully" if payload.consent else "Consent withdrawn"
    )


@router.get("/gdpr/consent", response_model=ConsentResponse)
async def get_consent_legacy(
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> ConsentResponse:
    """
    Legacy endpoint - use /api/consent/status instead.
    Get current user's GDPR consent status.
    """
    return ConsentResponse(
        success=True,
        message="consented" if current_user.gdpr_consent else "not_consented"
    )
