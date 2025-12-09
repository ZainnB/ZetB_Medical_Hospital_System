"""
Shared pytest fixtures for all tests.
"""
import pytest
import os
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import models
from app.core.config import settings


@pytest.fixture(scope="function")
def client():
    """Create a test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """Ensure test database is set up and cleaned up."""
    # Use test database path if provided, otherwise use default
    test_db_path = os.getenv("DB_PATH", settings.DB_PATH)
    
    # Create tables if they don't exist
    engine = create_engine(f"sqlite:///{test_db_path}", connect_args={"check_same_thread": False})
    models.Base.metadata.create_all(bind=engine)
    
    yield
    
    # Optional: Clean up test database after all tests
    # Uncomment if you want to delete test DB after tests
    # if "test" in test_db_path.lower() and Path(test_db_path).exists():
    #     Path(test_db_path).unlink()

