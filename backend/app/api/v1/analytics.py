from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database.session import get_db
from app.models.entities import ContentQueue, Lead, LessonLearned, Analytics
from app.schemas.dtos import DashboardSummary

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Content queue metrics
    items = db.execute(select(ContentQueue)).scalars().all()
    
    total_content = len(items)
    pending_compliance = sum(1 for i in items if i.compliance_status == "pending")
    pending_human_review = sum(1 for i in items if i.status == "human_review" or (i.compliance_status == "passed" and i.status == "pending"))
    approved = sum(1 for i in items if i.status == "approved")
    rejected = sum(1 for i in items if i.status == "rejected")
    published = sum(1 for i in items if i.status == "published")
    
    compliance_scores = [i.compliance_score for i in items if i.compliance_score > 0]
    avg_score = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0.0

    brand_counts = dict(Counter(i.brand for i in items))
    platform_counts = dict(Counter(i.platform for i in items))

    total_leads = db.execute(select(func.count(Lead.id))).scalar() or 0
    total_lessons = db.execute(select(func.count(LessonLearned.id))).scalar() or 0

    return DashboardSummary(
        total_content=total_content,
        pending_compliance=pending_compliance,
        pending_human_review=pending_human_review,
        approved=approved,
        rejected=rejected,
        published=published,
        average_compliance_score=round(avg_score, 1),
        total_leads=total_leads,
        total_lessons_learned=total_lessons,
        brand_breakdown=brand_counts,
        platform_breakdown=platform_counts,
    )
