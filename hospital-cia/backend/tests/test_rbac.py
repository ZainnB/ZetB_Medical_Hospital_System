import pytest
from fastapi.testclient import TestClient

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
        username="admin_test",
        email="admin@test.com",
        hashed_password=hash_password("Admin123!"),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def doctor_user(db):
    """Create a doctor user."""
    user = models.User(
        username="doctor_test",
        email="doctor@test.com",
        hashed_password=hash_password("Doctor123!"),
        role="doctor",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def receptionist_user(db):
    """Create a receptionist user."""
    user = models.User(
        username="recep_test",
        email="recep@test.com",
        hashed_password=hash_password("Recep123!"),
        role="receptionist",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_auth_headers(user):
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.user_id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_access_users_endpoint(client, admin_user):
    """Test that admin can access users endpoint."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/users", headers=headers)
    assert response.status_code == 200


def test_doctor_cannot_access_users_endpoint(client, doctor_user):
    """Test that doctor cannot access users endpoint."""
    headers = get_auth_headers(doctor_user)
    response = client.get("/api/users", headers=headers)
    assert response.status_code == 403


def test_receptionist_can_add_patient(client, receptionist_user, db):
    """Test that receptionist can add patients."""
    headers = get_auth_headers(receptionist_user)
    response = client.post(
        "/api/patients",
        json={"name": "Test Patient", "contact": "555-1234", "diagnosis": "Test"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["patient_id"] is not None


def test_doctor_cannot_add_patient(client, doctor_user):
    """Test that doctor cannot add patients."""
    headers = get_auth_headers(doctor_user)
    response = client.post(
        "/api/patients",
        json={"name": "Test Patient", "contact": "555-1234"},
        headers=headers,
    )
    assert response.status_code == 403


def test_admin_can_anonymize_patients(client, admin_user, db):
    """Test that admin can anonymize patients."""
    # Create a test patient
    patient = models.Patient(name="Test Patient", contact="555-1234")
    db.add(patient)
    db.commit()
    db.refresh(patient)

    headers = get_auth_headers(admin_user)
    response = client.post(
        "/api/patients/anonymize",
        json={"patient_id": None},  # Anonymize all
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["anonymized_count"] >= 1


def test_doctor_cannot_anonymize_patients(client, doctor_user):
    """Test that doctor cannot anonymize patients."""
    headers = get_auth_headers(doctor_user)
    response = client.post(
        "/api/patients/anonymize",
        json={"patient_id": None},
        headers=headers,
    )
    assert response.status_code == 403


def test_admin_can_view_logs(client, admin_user):
    """Test that admin can view audit logs."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/logs", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert "total" in data


def test_doctor_cannot_view_logs(client, doctor_user):
    """Test that doctor cannot view audit logs."""
    headers = get_auth_headers(doctor_user)
    response = client.get("/api/logs", headers=headers)
    assert response.status_code == 403

