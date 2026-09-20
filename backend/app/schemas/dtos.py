from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.schemas.agent_contracts import (
    ResearchInsight,
    CompetitorInsight,
    ContentBrief,
    GeneratedVariation,
    ComplianceResult,
    ComplianceViolation,
    HumanReviewAction,
    FeedbackRecord,
    LessonLearned,
    LeadProspect,
    PublishingSchedule,
)

# ----------------- Content Queue DTOs -----------------
class ContentQueueBase(BaseModel):
    brand: str
    platform: str
    content_type: str = "post"
    topic: str
    content_raw: str
    variation: str = "A"
    language: str = "en"
    compliance_status: str = "pending"
    status: str = "pending"
    compliance_score: float = 0.0
    reason_tag: Optional[str] = None
    notes: Optional[str] = None
    metadata_json: Optional[str] = None

class ContentQueueCreate(ContentQueueBase):
    pass

class ContentQueueUpdate(BaseModel):
    brand: Optional[str] = None
    platform: Optional[str] = None
    content_type: Optional[str] = None
    topic: Optional[str] = None
    content_raw: Optional[str] = None
    variation: Optional[str] = None
    language: Optional[str] = None
    compliance_status: Optional[str] = None
    status: Optional[str] = None
    compliance_score: Optional[float] = None
    reason_tag: Optional[str] = None
    notes: Optional[str] = None
    metadata_json: Optional[str] = None

class ContentQueueResponse(ContentQueueBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Competitor DTOs -----------------
class CompetitorBase(BaseModel):
    name: str
    url: Optional[str] = None
    category: str
    title: str
    summary: str
    detected_change: Optional[str] = None
    actionable_recommendation: Optional[str] = None
    relevance: float = 0.5
    source: str = "public_web"
    source_type: Optional[str] = None

class CompetitorCreate(CompetitorBase):
    pass

class CompetitorResponse(CompetitorBase):
    id: int
    collected_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Lead DTOs -----------------
class LeadBase(BaseModel):
    name: str
    company: str
    industry: str
    email: Optional[str] = None
    location: Optional[str] = None
    company_size: Optional[str] = None
    fit_score: float = 0.0
    qualification_reason: Optional[str] = None
    recommended_brand: Optional[str] = None
    outreach_draft: Optional[str] = None
    source: Optional[str] = "prospecting"
    source_type: Optional[str] = None
    status: str = "new"

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Feedback DTOs -----------------
class FeedbackCreate(BaseModel):
    content_id: int
    reason_tag: str
    notes: str
    original_content: str
    corrected_content: Optional[str] = None

class FeedbackResponse(FeedbackCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Lessons Learned DTOs -----------------
class LessonLearnedCreate(BaseModel):
    category: str
    lesson: str
    examples: Optional[str] = None
    frequency: int = 1
    active: bool = True

class LessonLearnedResponse(LessonLearnedCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Analytics DTOs -----------------
class AnalyticsMetricCreate(BaseModel):
    metric_name: str
    brand: Optional[str] = None
    platform: Optional[str] = None
    metric_value: float
    metadata_json: Optional[str] = None

class AnalyticsMetricResponse(AnalyticsMetricCreate):
    id: int
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardSummary(BaseModel):
    total_content: int
    pending_compliance: int
    pending_human_review: int
    compliance_approved: int
    human_approved: int
    approved: int # alias to human_approved
    rejected: int
    edited: int = 0
    published: int
    rejection_rate: float
    average_compliance_score: float
    total_leads: int
    average_lead_score: float
    total_lessons_learned: int
    regeneration_count: int = 0
    brand_breakdown: Dict[str, int]
    platform_breakdown: Dict[str, int]
    language_breakdown: Dict[str, int]
    feedback_reason_frequency: Dict[str, int]

# ----------------- Publishing DTOs -----------------
class PublishingRecordBase(BaseModel):
    content_id: int
    platform: str
    external_post_id: Optional[str] = None
    status: str = "scheduled"
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    engagement_metrics: Optional[str] = None
    error_info: Optional[str] = None

class PublishingRecordCreate(PublishingRecordBase):
    pass

class PublishingRecordResponse(PublishingRecordBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
