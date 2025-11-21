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
                    "email": "zainbaig.zb03@gmail.com",
                    "password": "Admin123!",
                    "role": "admin"
                },
                {
                    "username": "Dr_Usama",
                    "email": "k224593@gmail.com",
                    "password": "Doctor123!",
                    "role": "doctor"
                },
                {
                    "username": "recep_Aarij",
                    "email": "abc@gmail.com",
                    "password": "Recep123!",
                    "role": "receptionist"
                },
                {
                    "username": "user_Zain",
                    "email": "xyz@gmail.com",
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
                    "name": "Zain Baig",
                    "contact": "033-2345",
                    "diagnosis": "Routine checkup"
                },
                {
                    "name": "Jane Smith",
                    "contact": "033-8765",
                    "diagnosis": "Follow-up appointment"
                },
                {
                    "name": "Bob Johnson",
                    "contact": "032-0103",
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
