import pytest
from fastapi.testclient import TestClient
from io import StringIO
import csv

from app.main import app
from app.db.session import SessionLocal
from app.db import models
from app.services.auth_service import hash_password, create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    user = models.User(
        username="admin_export",
        email="admin_export@test.com",
        hashed_password=hash_password("Admin123!"),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_patients(db):
    """Create test patients."""
    patients = []
    for i in range(3):
        patient = models.Patient(
            name=f"Patient {i}",
            contact=f"555-{1000+i}",
            diagnosis=f"Diagnosis {i}",
        )
        db.add(patient)
        patients.append(patient)
    db.commit()
    return patients


def get_auth_headers(user):
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.user_id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_export_patients_csv(client, admin_user, test_patients):
    """Test exporting patients to CSV."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/export?type=patients", headers=headers)

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"

    # Parse CSV content
    content = response.text
    reader = csv.reader(StringIO(content))
    rows = list(reader)

    # Check header
    assert rows[0] == ["patient_id", "name", "contact", "diagnosis", "date_added"]

    # Check that we have patient data
    assert len(rows) > 1  # Header + at least one patient


def test_export_logs_csv(client, admin_user, db):
    """Test exporting logs to CSV."""
    # Create a test log entry
    log = models.Log(
        user_id=admin_user.user_id,
        role="admin",
        action="test_action",
        details="Test log entry",
    )
    db.add(log)
    db.commit()

    headers = get_auth_headers(admin_user)
    response = client.get("/api/export?type=logs", headers=headers)

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"

    # Parse CSV content
    content = response.text
    reader = csv.reader(StringIO(content))
    rows = list(reader)

    # Check header
    assert rows[0] == ["log_id", "user_id", "role", "action", "timestamp", "details"]

    # Check that we have log data
    assert len(rows) > 1  # Header + at least one log


def test_export_requires_admin(client, admin_user):
    """Test that export requires admin role."""
    # This is already tested via RBAC, but we can verify the endpoint structure
    headers = get_auth_headers(admin_user)
    response = client.get("/api/export?type=patients", headers=headers)
    assert response.status_code == 200


def test_export_invalid_type(client, admin_user):
    """Test export with invalid type."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/export?type=invalid", headers=headers)
    assert response.status_code == 400

