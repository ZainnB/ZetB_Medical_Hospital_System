import sys
from pathlib import Path
from datetime import datetime

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from app.core.config import settings  # noqa: E402
from app.db import models  # noqa: E402

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def get_engine():
    return create_engine(f"sqlite:///{settings.DB_PATH}", connect_args={"check_same_thread": False})


def initialize_database():
    """Initialize database with tables and seed data."""
    db_file = Path(settings.DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)

    engine = get_engine()
    models.Base.metadata.create_all(bind=engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Check if users already exist
        if session.query(models.User).count() == 0:
            seed_users = [
                {
                    "username": "admin",
                    "email": "admin@hospital.local",
                    "password": "Admin123!",
                    "role": "admin"
                },
                {
                    "username": "dr_smith",
                    "email": "dr.smith@hospital.local",
                    "password": "Doctor123!",
                    "role": "doctor"
                },
                {
                    "username": "recep_jane",
                    "email": "receptionist@hospital.local",
                    "password": "Recep123!",
                    "role": "receptionist"
                },
                {
                    "username": "user1",
                    "email": "user1@hospital.local",
                    "password": "User123!",
                    "role": "user"
                },
            ]
            
            for user_data in seed_users:
                user = models.User(
                    username=user_data["username"],
                    email=user_data["email"],
                    hashed_password=pwd_context.hash(user_data["password"]),
                    role=user_data["role"],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                session.add(user)
            
            # Seed sample patients
            seed_patients = [
                {
                    "name": "John Doe",
                    "contact": "555-0101",
                    "diagnosis": "Routine checkup"
                },
                {
                    "name": "Jane Smith",
                    "contact": "555-0102",
                    "diagnosis": "Follow-up appointment"
                },
                {
                    "name": "Bob Johnson",
                    "contact": "555-0103",
                    "diagnosis": "Annual physical"
                },
            ]
            
            for patient_data in seed_patients:
                patient = models.Patient(
                    name=patient_data["name"],
                    contact=patient_data["contact"],
                    diagnosis=patient_data["diagnosis"],
                    date_added=datetime.utcnow()
                )
                session.add(patient)
            
            session.commit()
            print(f"Database initialized with {len(seed_users)} users and {len(seed_patients)} patients")
            print("\nDefault credentials:")
            for user_data in seed_users:
                print(f"  {user_data['username']} ({user_data['role']}): {user_data['password']}")
        else:
            print("Database already initialized. Skipping seed data.")
    except Exception as e:
        session.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    initialize_database()
