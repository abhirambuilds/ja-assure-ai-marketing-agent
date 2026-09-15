import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# Ensure sqlite directory exists if file-based
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    sqlite_path = db_url.replace("sqlite:///", "")
    # resolve relative path to absolute
    if not os.path.isabs(sqlite_path):
        # Anchor relative to workspace root or data folder
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        resolved_path = (base_dir / sqlite_path).resolve()
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{resolved_path.as_posix()}"
    else:
        Path(sqlite_path).parent.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
