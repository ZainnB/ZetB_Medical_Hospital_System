from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.db import models
from app.services import anonymize_service, auth_service
from app.services.logging_service import log_action

router = APIRouter()


class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact: Optional[str] = Field(None, max_length=255)
    diagnosis: Optional[str] = None


class PatientOut(BaseModel):
    patient_id: int
    name: Optional[str] = None
    contact: Optional[str] = None
    diagnosis: Optional[str] = None
    date_added: datetime

    class Config:
        from_attributes = True


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact: Optional[str] = Field(None, max_length=255)
    diagnosis: Optional[str] = None


class AnonymizeRequest(BaseModel):
    patient_id: Optional[int] = None  # None means anonymize all


class AnonymizeResponse(BaseModel):
    message: str
    anonymized_count: int


@router.get("/", response_model=list[PatientOut])
async def list_patients(
    raw: bool = Query(False, description="Return raw data (admin only)"),
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> list[PatientOut]:
    """
    List patients with role-based data filtering.
    - Admin: can see raw or anonymized data based on ?raw=true
    - Doctor: sees anonymized data only
    - Receptionist: sees non-sensitive fields only
    - User: no access
    """
    # Check access
    if current_user.role not in ["admin", "doctor", "receptionist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Insufficient permissions."
        )
    
    # Admin can request raw data
    if raw and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can request raw data"
        )
    
    patients = db.query(models.Patient).order_by(models.Patient.date_added.desc()).all()
    
    # Transform based on role
    result = []
    for patient in patients:
        data = anonymize_service.get_anonymized_patient_data(patient, current_user.role, raw)
        if data:  # Only include if user has access
            result.append(PatientOut(**data))
    
    # Log view action (aggregated to avoid DOS)
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_patients",
        details=f"Viewed {len(result)} patients (raw={raw})",
        db=db
    )
    
    return result


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: int,
    raw: bool = Query(False, description="Return raw data (admin only)"),
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db_session),
) -> PatientOut:
    """
    Get a single patient by ID with role-based data filtering.
    """
    if current_user.role not in ["admin", "doctor", "receptionist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Insufficient permissions."
        )
    
    if raw and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can request raw data"
        )
    
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    data = anonymize_service.get_anonymized_patient_data(patient, current_user.role, raw)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="view_patient",
        details=f"Viewed patient {patient_id}",
        db=db
    )
    
    return PatientOut(**data)


@router.post("/", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    current_user: models.User = Depends(auth_service.require_role("admin", "receptionist")),
    db: Session = Depends(get_db_session),
) -> PatientOut:
    """
    Create a new patient. Only admin and receptionist can create patients.
    """
    # Validate input
    if not payload.name or len(payload.name.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient name is required"
        )
    
    # Create patient
    patient = models.Patient(
        name=payload.name.strip(),
        contact=payload.contact.strip() if payload.contact else None,
        diagnosis=payload.diagnosis,
        date_added=datetime.utcnow()
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Anonymize immediately
    anonymize_service.mask_patient(patient)
    db.commit()
    db.refresh(patient)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="add_patient",
        details=f"Added patient {patient.patient_id}",
        db=db
    )
    
    # Return based on role
    data = anonymize_service.get_anonymized_patient_data(patient, current_user.role, raw=False)
    return PatientOut(**data)


@router.put("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    current_user: models.User = Depends(auth_service.require_role("admin", "receptionist")),
    db: Session = Depends(get_db_session),
) -> PatientOut:
    """
    Update a patient. Only admin and receptionist can update patients.
    """
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update fields
    if payload.name is not None:
        patient.name = payload.name.strip()
    if payload.contact is not None:
        patient.contact = payload.contact.strip()
    if payload.diagnosis is not None:
        patient.diagnosis = payload.diagnosis
    
    # Re-anonymize if name or contact changed
    if payload.name is not None or payload.contact is not None:
        anonymize_service.mask_patient(patient)
    
    db.commit()
    db.refresh(patient)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="update_patient",
        details=f"Updated patient {patient_id}",
        db=db
    )
    
    # Return based on role
    data = anonymize_service.get_anonymized_patient_data(patient, current_user.role, raw=False)
    return PatientOut(**data)


@router.post("/anonymize", response_model=AnonymizeResponse)
async def anonymize_patients(
    payload: AnonymizeRequest,
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> AnonymizeResponse:
    """
    Anonymize patient data. Admin only.
    If patient_id is provided, anonymize that patient only.
    If patient_id is None, anonymize all patients.
    """
    if payload.patient_id:
        # Anonymize single patient
        patient = db.query(models.Patient).filter(models.Patient.patient_id == payload.patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        anonymize_service.mask_patient(patient)
        db.commit()
        count = 1
    else:
        # Anonymize all patients
        count = anonymize_service.anonymize_all_patients(db)
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="anonymize",
        details=f"Anonymized {count} patient(s)" + (f" (patient_id={payload.patient_id})" if payload.patient_id else ""),
        db=db
    )
    
    return AnonymizeResponse(
        message=f"Successfully anonymized {count} patient(s)",
        anonymized_count=count
    )
