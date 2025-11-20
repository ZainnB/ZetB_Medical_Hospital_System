"""
Database backup script.
Creates timestamped backups of the SQLite database.
"""
import sys
import shutil
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from app.core.config import settings  # noqa: E402


def backup_database():
    """Create a timestamped backup of the database."""
    db_path = Path(settings.DB_PATH)
    
    if not db_path.exists():
        print(f"Database file not found: {db_path}")
        return False
    
    # Create backups directory
    backups_dir = db_path.parent / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"hospital_backup_{timestamp}.db"
    backup_path = backups_dir / backup_filename
    
    try:
        # Copy database file
        shutil.copy2(db_path, backup_path)
        print(f"Database backed up successfully to: {backup_path}")
        
        # Update last sync time in config (if possible)
        try:
            settings.LAST_SYNC_TIME = datetime.utcnow()
        except Exception:
            pass
        
        return True
    except Exception as e:
        print(f"Error creating backup: {e}")
        return False


def list_backups():
    """List all available backups."""
    db_path = Path(settings.DB_PATH)
    backups_dir = db_path.parent / "backups"
    
    if not backups_dir.exists():
        print("No backups directory found.")
        return []
    
    backups = sorted(backups_dir.glob("hospital_backup_*.db"), reverse=True)
    
    if not backups:
        print("No backups found.")
        return []
    
    print(f"\nFound {len(backups)} backup(s):")
    for backup in backups:
        size = backup.stat().st_size / 1024  # Size in KB
        mtime = datetime.fromtimestamp(backup.stat().st_mtime)
        print(f"  {backup.name} ({size:.2f} KB, {mtime.strftime('%Y-%m-%d %H:%M:%S')})")
    
    return backups


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Backup hospital database")
    parser.add_argument("--list", action="store_true", help="List available backups")
    args = parser.parse_args()
    
    if args.list:
        list_backups()
    else:
        backup_database()

