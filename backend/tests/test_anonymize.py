import pytest
from app.db.session import SessionLocal
from app.db import models
from app.services import anonymize_service
from app.core.config import settings
from cryptography.fernet import Fernet


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_patient(db):
    """Create a test patient."""
    patient = models.Patient(
        name="John Doe",
        contact="555-1234",
        diagnosis="Test diagnosis",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def test_mask_patient_encrypts_fields(test_patient, db):
    """Test that mask_patient encrypts sensitive fields."""
    # Ensure we have a valid Fernet key
    if settings.FERNET_KEY == "generate-me":
        # Generate a key for testing
        key = Fernet.generate_key()
        settings.FERNET_KEY = key.decode()

    original_name = test_patient.name
    original_contact = test_patient.contact

    anonymize_service.mask_patient(test_patient)
    db.commit()

    # Check that anonymized fields are set
    assert test_patient.anonymized_name is not None
    assert test_patient.anonymized_contact is not None

    # Check that anonymized fields are different from original
    assert test_patient.anonymized_name != original_name
    assert test_patient.anonymized_contact != original_contact


def test_decrypt_field(test_patient, db):
    """Test that encrypted fields can be decrypted."""
    if settings.FERNET_KEY == "generate-me":
        key = Fernet.generate_key()
        settings.FERNET_KEY = key.decode()

    original_name = test_patient.name
    anonymize_service.mask_patient(test_patient)
    db.commit()

    # Decrypt and verify
    decrypted_name = anonymize_service.decrypt_field(test_patient.anonymized_name)
    assert decrypted_name == original_name


def test_anonymize_all_patients(db):
    """Test anonymizing all patients."""
    if settings.FERNET_KEY == "generate-me":
        key = Fernet.generate_key()
        settings.FERNET_KEY = key.decode()

    # Create multiple patients
    for i in range(3):
        patient = models.Patient(
            name=f"Patient {i}",
            contact=f"555-{1000+i}",
        )
        db.add(patient)
    db.commit()

    count = anonymize_service.anonymize_all_patients(db)
    assert count >= 3

    # Verify all are anonymized
    patients = db.query(models.Patient).all()
    for patient in patients:
        assert patient.anonymized_name is not None or patient.name is None

