from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    logs = relationship("Log", back_populates="user")
    
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'doctor', 'receptionist', 'user')", name="check_role"),
    )


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact = Column(String(255), nullable=True)
    diagnosis = Column(Text, nullable=True)
    anonymized_name = Column(String(255), nullable=True)
    anonymized_contact = Column(String(255), nullable=True)
    date_added = Column(DateTime, default=datetime.utcnow, nullable=False)


class Log(Base):
    __tablename__ = "logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    role = Column(String(50), nullable=True)
    action = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    details = Column(Text, nullable=True)
    user = relationship("User", back_populates="logs")


class MFACode(Base):
    __tablename__ = "mfa_codes"

    mfa_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    hashed_code = Column(String(255), nullable=False)
    temp_token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

