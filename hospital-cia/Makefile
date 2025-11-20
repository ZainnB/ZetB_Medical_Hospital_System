PYTHON ?= python
BACKEND_DIR := backend
FRONTEND_DIR := frontend

.PHONY: start-backend start-frontend start-docker init-db run-tests install-backend install-frontend

install-backend:
	cd $(BACKEND_DIR) && $(PYTHON) -m pip install -r requirements.txt

install-frontend:
	cd $(FRONTEND_DIR) && npm install

start-backend:
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

start-frontend:
	cd $(FRONTEND_DIR) && npm run dev

start-docker:
	docker compose up --build

init-db:
	cd $(BACKEND_DIR) && $(PYTHON) scripts/init_db.py

run-tests:
	cd $(BACKEND_DIR) && pytest

