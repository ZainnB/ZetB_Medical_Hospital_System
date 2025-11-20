import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.db import models
from app.services import auth_service, anonymize_service
from app.services.logging_service import log_action

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def export_csv(
    type: str = Query(..., description="Export type: 'patients' or 'logs'"),
    raw: bool = Query(False, description="Export raw data (admin only, for patients)"),
    role: Optional[str] = Query(None, description="Filter logs by role"),
    user_id: Optional[int] = Query(None, description="Filter logs by user_id"),
    action: Optional[str] = Query(None, description="Filter logs by action"),
    date_from: Optional[str] = Query(None, description="Filter logs from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter logs to date (YYYY-MM-DD)"),
    current_user: models.User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db_session),
) -> Response:
    """
    Export data to CSV. Admin only.
    Supports exporting patients or logs with filtering.
    """
    if type == "patients":
        return await _export_patients_csv(raw, current_user, db)
    elif type == "logs":
        return await _export_logs_csv(role, user_id, action, date_from, date_to, current_user, db)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid export type. Must be 'patients' or 'logs'"
        )


async def _export_patients_csv(raw: bool, current_user: models.User, db: Session) -> Response:
    """Export patients to CSV."""
    patients = db.query(models.Patient).order_by(models.Patient.date_added.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["patient_id", "name", "contact", "diagnosis", "date_added"])
    
    # Write data
    for patient in patients:
        if raw:
            # Admin can see raw data
            try:
                name = anonymize_service.decrypt_field(patient.anonymized_name) if patient.anonymized_name else patient.name
                contact = anonymize_service.decrypt_field(patient.anonymized_contact) if patient.anonymized_contact else patient.contact
            except Exception:
                name = patient.name
                contact = patient.contact
        else:
            # Anonymized data
            name = patient.anonymized_name or f"ANON_{patient.patient_id}"
            contact = patient.anonymized_contact or "XXX-XXX-XXXX"
        
        writer.writerow([
            patient.patient_id,
            name,
            contact,
            patient.diagnosis or "",
            patient.date_added.isoformat() if patient.date_added else ""
        ])
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="export_csv",
        details=f"Exported {len(patients)} patients (raw={raw})",
        db=db
    )
    
    # Update last sync time
    from app.core.config import settings
    settings.LAST_SYNC_TIME = datetime.utcnow()
    
    csv_content = output.getvalue()
    output.close()
    
    filename = f"patients_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    
    return Response(content=csv_content, media_type="text/csv", headers=headers)


async def _export_logs_csv(
    role: Optional[str],
    user_id: Optional[int],
    action: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    current_user: models.User,
    db: Session
) -> Response:
    """Export logs to CSV with filtering."""
    query = db.query(models.Log)
    
    # Apply filters (same as logs endpoint)
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
            date_to_obj = date_to_obj.replace(hour=23, minute=59, second=59)
            query = query.filter(models.Log.timestamp <= date_to_obj)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    logs = query.order_by(models.Log.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["log_id", "user_id", "role", "action", "timestamp", "details"])
    
    # Write data
    for log in logs:
        writer.writerow([
            log.log_id,
            log.user_id or "",
            log.role or "",
            log.action,
            log.timestamp.isoformat() if log.timestamp else "",
            log.details or ""
        ])
    
    # Log action
    log_action(
        user_id=current_user.user_id,
        role=current_user.role,
        action="export_csv",
        details=f"Exported {len(logs)} log entries",
        db=db
    )
    
    # Update last sync time
    from app.core.config import settings
    settings.LAST_SYNC_TIME = datetime.utcnow()
    
    csv_content = output.getvalue()
    output.close()
    
    filename = f"logs_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    
    return Response(content=csv_content, media_type="text/csv", headers=headers)
