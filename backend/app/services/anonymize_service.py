from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Fernet cipher
_fernet: Fernet | None = None


def get_fernet() -> Fernet:
    """Get or create Fernet cipher instance."""
    global _fernet
    if _fernet is None:
        key = settings.FERNET_KEY.encode()
        try:
            _fernet = Fernet(key)
        except Exception as e:
            logger.error(f"Failed to initialize Fernet: {e}")
            raise ValueError(f"Invalid FERNET_KEY: {e}")
    return _fernet


def encrypt_field(value: str) -> str:
    """Encrypt a field value using Fernet."""
    if not value:
        return ""
    try:
        fernet = get_fernet()
        encrypted = fernet.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_field(encrypted_value: str) -> str:
    """Decrypt a field value using Fernet."""
    if not encrypted_value:
        return ""
    try:
        fernet = get_fernet()
        decrypted = fernet.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except InvalidToken:
        logger.error("Decryption failed: Invalid token")
        raise ValueError("Invalid encrypted value")
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise


def mask_patient(patient) -> None:
    """
    Anonymize patient data by encrypting sensitive fields.
    Stores encrypted values in anonymized_name and anonymized_contact.
    """
    if patient.name:
        try:
            patient.anonymized_name = encrypt_field(patient.name)
        except Exception as e:
            logger.error(f"Failed to anonymize name for patient {patient.patient_id}: {e}")
            patient.anonymized_name = f"ANON_{patient.patient_id}"
    
    if patient.contact:
        try:
            patient.anonymized_contact = encrypt_field(patient.contact)
        except Exception as e:
            logger.error(f"Failed to anonymize contact for patient {patient.patient_id}: {e}")
            # Mask contact: XXX-XXX-XXXX format
            if len(patient.contact) >= 4:
                last4 = patient.contact[-4:]
                patient.anonymized_contact = f"XXX-XXX-{last4}"
            else:
                patient.anonymized_contact = "XXX-XXX-XXXX"


def anonymize_all_patients(db) -> int:
    """
    Anonymize all patients in the database.
    Returns count of anonymized patients.
    """
    from app.db import models
    
    patients = db.query(models.Patient).all()
    count = 0
    
    for patient in patients:
        if not patient.anonymized_name or not patient.anonymized_contact:
            mask_patient(patient)
            count += 1
    
    db.commit()
    return count


def get_anonymized_patient_data(patient, role: str, raw: bool = False) -> dict:
    """
    Get patient data based on role and raw flag.
    - Admin with raw=True: returns decrypted original data
    - Admin with raw=False: returns anonymized data
    - Doctor: returns anonymized data only
    - Receptionist: returns non-sensitive fields only
    - User: no access
    """
    if role == "admin" and raw:
        # Admin can see raw data (decrypted)
        try:
            name = decrypt_field(patient.anonymized_name) if patient.anonymized_name else patient.name
            contact = decrypt_field(patient.anonymized_contact) if patient.anonymized_contact else patient.contact
        except Exception:
            # Fallback to original if decryption fails
            name = patient.name
            contact = patient.contact
        return {
            "patient_id": patient.patient_id,
            "name": name,
            "contact": contact,
            "diagnosis": patient.diagnosis,
            "date_added": patient.date_added,
        }
    elif role == "admin" or role == "doctor":
        # Return anonymized data
        return {
            "patient_id": patient.patient_id,
            "name": patient.anonymized_name or f"ANON_{patient.patient_id}",
            "contact": patient.anonymized_contact or "XXX-XXX-XXXX",
            "diagnosis": patient.diagnosis,
            "date_added": patient.date_added,
        }
    elif role == "receptionist":
        # Receptionist can see non-sensitive fields only
        return {
            "patient_id": patient.patient_id,
            "name": None,  # No name access
            "contact": None,  # No contact access
            "diagnosis": patient.diagnosis,
            "date_added": patient.date_added,
        }
    else:
        # User role - no access
        return {}
