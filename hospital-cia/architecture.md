# Hospital CIA Dashboard – Architecture Notes

## Components
- **Backend (`backend/app`)**: FastAPI service exposing auth, user, patient, logs, and export routes. Startup hook seeds SQLite via `scripts/init_db.py`.
- **Database (`backend/data/hospital.db`)**: SQLite + SQLAlchemy models for `User`, `Patient`, `Log`. Alembic directory reserved for migrations.
- **Frontend (`frontend/src`)**: Vite + React client with login screen, dashboard, and role-specific views.

## CIA Triad Touchpoints
- **Confidentiality**
  - `.env` driven secrets in `app/core/config.py`.
  - Future Fernet anonymization logic lives in `app/services/anonymize_service.py`.
  - Request-level audit middleware defined in `app/main.py`.
- **Integrity**
  - SQLAlchemy models & upcoming migrations protect schema consistency.
  - `scripts/init_db.py` centralizes seed data and hashed password handling.
  - Placeholder RBAC hooks inside `app/services/auth_service.py` + router dependencies ensure proper extension points.
- **Availability**
  - Docker + docker-compose orchestrate backend/frontend for reproducible deployments.
  - `tests/` provide startup validation; CI workflow executes tests/builds on every push.
  - React dashboard handles degraded states (loading/errors) with user feedback.

## Next Steps
1. Implement proper token issuance/verification (JWT or session service) in `auth_service`.
2. Wire Fernet-backed anonymization, ensuring keys are rotated & stored securely.
3. Build RBAC decorators/middleware that leverage user roles from the database.
4. Expand secure logging to persist in the `logs` table and forward to SIEM sink.
5. Replace mock CSV export with streaming query that respects consent & masking policies.

