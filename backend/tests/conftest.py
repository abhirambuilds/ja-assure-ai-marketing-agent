import os
import sys
from pathlib import Path
import pytest

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Use isolated local SQLite database for tests
test_db_dir = backend_path / "data"
test_db_dir.mkdir(parents=True, exist_ok=True)
test_db_file = test_db_dir / "test_ja_assure.db"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_file.as_posix()}"
os.environ["ENVIRONMENT"] = "test"

from sqlalchemy.orm import Session
from app.database.session import engine
from app.models.entities import Base, ContentQueue, Competitor, LessonLearned, Lead

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        if session.query(ContentQueue).count() == 0:
            item = ContentQueue(
                brand="jade",
                platform="linkedin",
                content_type="post",
                topic="Bespoke Jewellery Risk Management",
                content_raw="Protecting high net worth jewelry collections across Southeast Asia.",
                variation="A",
                language="en",
                compliance_status="passed",
                status="human_review",
                compliance_score=90.0,
                notes="Seeded test review item",
            )
            session.add(item)

        if session.query(Competitor).count() == 0:
            comp = Competitor(
                name="Chubb Specialized Fine Art & Jewellery",
                url="https://chubb.com/sg",
                category="jewellery",
                title="Commercial Coverage Update",
                summary="Expanded high-value bespoke collections endorsement.",
                relevance=0.85,
            )
            session.add(comp)

        if session.query(LessonLearned).count() == 0:
            lesson = LessonLearned(
                category="compliance",
                lesson="All financial and underwriting copy must disclaim insurance terms and refer to PDS.",
                active=True,
            )
            session.add(lesson)

        if session.query(Lead).count() == 0:
            lead = Lead(
                name="Dato' Raymond Tan",
                company="Royal Pavilions Fine Jewellery",
                industry="jewellery",
                fit_score=88.0,
                status="qualified",
                recommended_brand="jade",
            )
            session.add(lead)

        session.commit()
    yield
