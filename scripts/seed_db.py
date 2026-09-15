import os
import sys
import json
from pathlib import Path

# Add backend to path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.session import SessionLocal, engine
from app.models.entities import (
    Base,
    ContentQueue,
    Competitor,
    Lead,
    LessonLearned,
    Feedback
)

def seed():
    print("--- Initializing Database Tables ---")
    Base.metadata.create_all(bind=engine)
    
    seed_file = current_dir.parent / "data" / "seed" / "seed_data.json"
    if not seed_file.exists():
        print(f"Error: Seed file {seed_file} not found.")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_content = db.query(ContentQueue).count()
        if existing_content > 0:
            print(f"Database already contains {existing_content} content items. Skipping seeding to prevent duplicate data.")
            return

        print("Seeding Competitors...")
        for c in data.get("competitors", []):
            db.add(Competitor(**c))

        print("Seeding Lessons Learned...")
        for l in data.get("lessons_learned", []):
            db.add(LessonLearned(**l))

        print("Seeding Content Queue...")
        for q in data.get("content_queue", []):
            db.add(ContentQueue(**q))

        print("Seeding Leads...")
        for ld in data.get("leads", []):
            db.add(Lead(**ld))

        db.commit()
        print("--- Database successfully seeded! ---")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
