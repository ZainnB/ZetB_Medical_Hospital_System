import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

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
        username="admin_stats_test",
        email="admin_stats@test.com",
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
        username="doctor_stats_test",
        email="doctor_stats@test.com",
        hashed_password=hash_password("Doctor123!"),
        role="doctor",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_logs(db, admin_user):
    """Create test log entries."""
    logs = []
    for i in range(5):
        log = models.Log(
            user_id=admin_user.user_id,
            role="admin",
            action=f"test_action_{i}",
            details=f"Test log {i}",
            timestamp=datetime.utcnow() - timedelta(days=i),
        )
        db.add(log)
        logs.append(log)
    db.commit()
    return logs


def get_auth_headers(user):
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.user_id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_get_activity_stats_requires_admin(client, doctor_user):
    """Test that activity stats endpoint requires admin role."""
    headers = get_auth_headers(doctor_user)
    response = client.get("/api/stats/activity", headers=headers)
    assert response.status_code == 403


def test_get_activity_stats_success(client, admin_user, test_logs):
    """Test getting activity statistics."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/stats/activity?days=7", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "days" in data
    assert "actions_per_day" in data
    assert "actions_by_role" in data
    assert "actions_by_type" in data
    assert len(data["days"]) > 0
    assert len(data["actions_per_day"]) > 0


def test_get_retention_settings_requires_admin(client, doctor_user):
    """Test that retention settings endpoint requires admin role."""
    headers = get_auth_headers(doctor_user)
    response = client.get("/api/admin/retention", headers=headers)
    assert response.status_code == 403


def test_get_retention_settings_success(client, admin_user):
    """Test getting retention settings."""
    headers = get_auth_headers(admin_user)
    response = client.get("/api/admin/retention", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "retention_days" in data
    assert "enabled" in data
    assert "logs_to_delete" in data


def test_update_retention_settings_requires_admin(client, doctor_user):
    """Test that updating retention settings requires admin role."""
    headers = get_auth_headers(doctor_user)
    response = client.post(
        "/api/admin/retention",
        json={"retention_days": 30, "enabled": True},
        headers=headers,
    )
    assert response.status_code == 403


def test_update_retention_settings_success(client, admin_user, test_logs):
    """Test updating retention settings."""
    headers = get_auth_headers(admin_user)
    response = client.post(
        "/api/admin/retention",
        json={"retention_days": 30, "enabled": True},
        headers=headers,
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["retention_days"] == 30
    assert data["enabled"] is True


def test_get_consent_stats_requires_admin(client, doctor_user):
    """Test that consent stats endpoint requires admin role."""
    headers = get_auth_headers(doctor_user)
    response = client.get("/api/admin/consent-stats", headers=headers)
    assert response.status_code == 403


def test_get_consent_stats_success(client, admin_user, db):
    """Test getting consent statistics."""
    # Create users with different consent status
    user1 = models.User(
        username="consent_user1",
        email="consent1@test.com",
        hashed_password=hash_password("Test123!"),
        role="user",
        is_active=True,
        gdpr_consent=True,
    )
    user2 = models.User(
        username="consent_user2",
        email="consent2@test.com",
        hashed_password=hash_password("Test123!"),
        role="user",
        is_active=True,
        gdpr_consent=False,
    )
    db.add(user1)
    db.add(user2)
    db.commit()
    
    headers = get_auth_headers(admin_user)
    response = client.get("/api/admin/consent-stats", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "consented_users" in data
    assert "consent_percentage" in data
    assert "last_updated" in data
    assert data["total_users"] >= 2
    assert data["consent_percentage"] >= 0


