import importlib

from sqlalchemy.orm import sessionmaker

from app.db import models


def test_initialize_database_creates_sqlite_file(tmp_path, monkeypatch):
    test_db = tmp_path / "hospital.db"
    monkeypatch.setenv("DB_PATH", str(test_db))

    config = importlib.import_module("app.core.config")
    importlib.reload(config)

    init_db = importlib.import_module("scripts.init_db")
    importlib.reload(init_db)

    init_db.initialize_database()

    assert test_db.exists(), "Database file should be created"

    engine = init_db.get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        users = session.query(models.User).all()
        assert len(users) == 3
    finally:
        session.close()

    monkeypatch.delenv("DB_PATH", raising=False)
    importlib.reload(config)

