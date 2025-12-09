import pytest
from fastapi.testclient import TestClient
from datetime import datetime

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
def test_user(db):
    """Create a test user."""
    user = models.User(
        username="gdpr_test_user",
        email="gdpr_test@example.com",
        hashed_password=hash_password("Test123!"),
        role="user",
        is_active=True,
        gdpr_consent=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_auth_headers(user):
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.user_id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_get_consent_status_requires_auth(client):
    """Test that consent status endpoint requires authentication."""
    response = client.get("/api/consent/status")
    assert response.status_code == 403


def test_get_consent_status_success(client, test_user):
    """Test getting consent status for authenticated user."""
    headers = get_auth_headers(test_user)
    response = client.get("/api/consent/status", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "has_consented" in data
    assert data["has_consented"] is False
    assert data["consent_date"] is None


def test_accept_consent_requires_auth(client):
    """Test that accept consent endpoint requires authentication."""
    response = client.post("/api/consent/accept", json={"accepted": True})
    assert response.status_code == 403


def test_accept_consent_success(client, test_user, db):
    """Test accepting consent."""
    headers = get_auth_headers(test_user)
    response = client.post("/api/consent/accept", json={"accepted": True}, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["has_consented"] is True
    
    # Verify database was updated
    db.refresh(test_user)
    assert test_user.gdpr_consent is True
    assert test_user.gdpr_consent_date is not None


def test_decline_consent_success(client, test_user, db):
    """Test declining consent."""
    # First accept consent
    headers = get_auth_headers(test_user)
    client.post("/api/consent/accept", json={"accepted": True}, headers=headers)
    
    # Then decline
    response = client.post("/api/consent/accept", json={"accepted": False}, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["has_consented"] is False
    
    # Verify database was updated
    db.refresh(test_user)
    assert test_user.gdpr_consent is False
    assert test_user.gdpr_consent_date is None


def test_consent_status_after_accept(client, test_user):
    """Test consent status after accepting."""
    headers = get_auth_headers(test_user)
    
    # Accept consent
    client.post("/api/consent/accept", json={"accepted": True}, headers=headers)
    
    # Check status
    response = client.get("/api/consent/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["has_consented"] is True
    assert data["consent_date"] is not None


