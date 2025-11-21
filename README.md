# Hospital Management System - GDPR-Aware Hospital Management

A fully functional, GDPR-compliant Hospital Management System implementing Confidentiality, Integrity, and Availability (CIA) triad with role-based access control (RBAC), multi-factor authentication (MFA), and comprehensive audit logging.

## Features

### Security & Compliance
- **GDPR Compliance**: Data minimization, encryption at rest, audit logging, role-based access control
- **Multi-Factor Authentication**: Email-based MFA with time-limited one-time codes
- **Encryption**: Fernet encryption for sensitive patient data (reversible anonymization)
- **RBAC**: Four roles (Admin, Doctor, Receptionist, User) with granular permissions
- **Audit Logging**: Comprehensive logging of all user actions (no PII in logs)

### CIA Triad Implementation
- **Confidentiality**: Encryption, anonymization, role-based data filtering
- **Integrity**: Audit logs, validation, database constraints
- **Availability**: Health checks, error handling, backup/export functionality

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite, JWT, Fernet encryption
- **Frontend:** React (Vite), Axios, React Router, react-hot-toast
- **Storage:** SQLite
- **Testing:** pytest, TestClient
- **Deployment:** Docker, Docker Compose

## Prerequisites

- Python 3.11+
- Node 20+
- npm 10+
- Docker / Docker Compose (optional)
- Gmail account with App Password (for MFA emails)

## Installation

### 1. Clone and Setup Environment

```bash
cd hospital-cia
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env
```

Generate secure keys:

```bash
# Generate FERNET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate SECRET_KEY (for JWT)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Edit `.env` with your values:

```env
ENVIRONMENT=development
DB_PATH=backend/data/hospital.db
SECRET_KEY=your-generated-secret-key-here
FERNET_KEY=your-generated-fernet-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# SMTP Settings for MFA
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_USE_TLS=True
```

### 4. Gmail App Password Setup

For MFA to work, you need a Gmail App Password:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate an app password for "Mail"
5. Use this password in `SMTP_PASSWORD` (not your regular Gmail password)

**Note:** In development mode, if SMTP is not configured, MFA codes will be logged to console instead of sent via email.

### 5. Initialize Database

```bash
cd backend
python scripts/init_db.py
```

This creates the database with seed users:
- `admin` / `Admin123!` (admin role)
- `dr_smith` / `Doctor123!` (doctor role)
- `recep_jane` / `Recep123!` (receptionist role)
- `user1` / `User123!` (user role)

### 6. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```
Backend runs on http://localhost:8000

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

### Docker

```bash
docker compose up --build
```

## Usage

### Authentication Flow

1. **Register**: Create a new account (default role: user)
2. **Login**: Enter username/email and password
3. **MFA**: Check email for 6-digit code (valid 5 minutes)
4. **Verify**: Enter code to complete login and receive JWT token

### Role-Based Access

#### Admin
- Full access to all features
- View raw or anonymized patient data
- Manage users and roles
- View and export audit logs
- Anonymize patient data
- Export CSV data

#### Doctor
- View anonymized patient data only
- Cannot add/edit patients
- Cannot view raw data

#### Receptionist
- Add and edit patients
- View non-sensitive patient fields only
- Cannot view names/contacts

#### User
- View own profile only
- Limited system access

### Key Features

#### Patient Management
- Add patients (Receptionist/Admin)
- Edit patients (Receptionist/Admin)
- View role-filtered data
- Anonymize data (Admin only)

#### Audit Logging
- All actions logged with user_id, role, action, timestamp
- No PII in log details
- Filterable by role, user, action, date range
- Exportable to CSV

#### Data Export
- Export patients to CSV (Admin only, with raw/anonymized option)
- Export audit logs to CSV (Admin only)
- Streaming response for large datasets

#### Health & Monitoring
- Health check endpoint: `/api/health`
- System metadata: `/api/meta` (uptime, last sync)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns temp_token for MFA)
- `POST /api/auth/mfa-verify` - Verify MFA code, get JWT
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Patients
- `GET /api/patients` - List patients (role-filtered)
- `GET /api/patients/{id}` - Get patient by ID
- `POST /api/patients` - Create patient (Receptionist/Admin)
- `PUT /api/patients/{id}` - Update patient (Receptionist/Admin)
- `POST /api/patients/anonymize` - Anonymize patients (Admin)

### Users
- `GET /api/users` - List users (Admin)
- `PUT /api/users/{id}/role` - Update user role (Admin)
- `PUT /api/users/{id}/activate` - Toggle user active status (Admin)

### Logs
- `GET /api/logs` - List audit logs with filtering (Admin)

### Export
- `GET /api/export?type=patients` - Export patients CSV (Admin)
- `GET /api/export?type=logs` - Export logs CSV (Admin)

### System
- `GET /api/health` - Health check
- `GET /api/meta` - System metadata

## Testing

### Backend Tests

```bash
cd backend
pytest
```

Tests cover:
- Authentication (register, login, MFA)
- RBAC enforcement
- Anonymization
- CSV export

### Frontend Tests

```bash
cd frontend
npm run test  # If configured
npm run lint
```

## Database Backup

Manual backup:
```bash
cd backend
python scripts/backup_db.py
```

List backups:
```bash
python scripts/backup_db.py --list
```

Backups are stored in `backend/data/backups/` with timestamps.

## Project Structure

```
hospital-cia/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Configuration
│   │   ├── db/           # Database models and session
│   │   ├── services/     # Business logic (auth, anonymize, email, logging)
│   │   └── main.py       # FastAPI app
│   ├── scripts/
│   │   ├── init_db.py    # Database initialization
│   │   └── backup_db.py  # Backup script
│   ├── tests/            # pytest tests
│   └── data/             # SQLite database and backups
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/    # API client
│   └── package.json
├── .env                  # Environment variables (not in git)
└── README.md
```

## Security Considerations

1. **Never commit `.env` file** - Contains secrets
2. **Use strong passwords** - Minimum 8 chars, uppercase, lowercase, digit
3. **Rotate keys regularly** - SECRET_KEY and FERNET_KEY
4. **Monitor audit logs** - Review regularly for suspicious activity
5. **Keep dependencies updated** - Run `pip list --outdated` and `npm outdated`

## GDPR Compliance Features

- **Data Minimization**: Only collect necessary patient data
- **Encryption**: Sensitive data encrypted at rest (Fernet)
- **Access Control**: RBAC ensures users only see data they need
- **Audit Trail**: All actions logged (without PII)
- **Data Export**: Patients can request their data (via admin export)
- **Anonymization**: Reversible anonymization for privacy

## Troubleshooting

### MFA emails not sending
- Check SMTP credentials in `.env`
- Verify Gmail App Password is correct
- Check firewall/network settings
- In development, codes are logged to console if SMTP fails

### Database errors
- Ensure `backend/data/` directory exists
- Run `python scripts/init_db.py` to recreate database
- Check file permissions

### JWT token errors
- Verify `SECRET_KEY` is set in `.env`
- Check token expiration (default 60 minutes)
- Clear browser localStorage and re-login

## License

This project is for educational/demonstration purposes.

## Contributing

1. Follow code style (black, isort for Python; Prettier for JS)
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass before submitting
