from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
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
    """
    Metadata-only patch DTO. Deliberately excludes `status`, `compliance_status`,
    `compliance_score`, and `content_raw` — those fields are HITL-governed and may only
    change through the dedicated /queue/{id}/approve|reject|edit|rewrite|regenerate
    actions, which route through app.services.hitl_service. This is what prevents a
    direct PATCH from fabricating an "approved" or "passed" asset. See hitl_service.py.
    """
    brand: Optional[str] = None
    platform: Optional[str] = None
    content_type: Optional[str] = None
    topic: Optional[str] = None
    variation: Optional[str] = None
    language: Optional[str] = None
    reason_tag: Optional[str] = None
    notes: Optional[str] = None
    metadata_json: Optional[str] = None

class ContentQueueResponse(ContentQueueBase):
    id: int
    original_content_raw: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Review Decision DTOs (HITL audit trail) -----------------
class ReviewDecisionResponse(BaseModel):
    id: int
    asset_type: str
    asset_id: int
    reviewer: str
    decision: str
    reason_tag: Optional[str] = None
    notes: Optional[str] = None
    original_content: Optional[str] = None
    edited_content: Optional[str] = None
    compliance_score: Optional[float] = None
    previous_status: str
    new_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Competitor DTOs -----------------
class CompetitorBase(BaseModel):
    name: str
    url: Optional[str] = None
    domain: Optional[str] = None
    brand: Optional[str] = None # jade, doctorshield, jaguartransit
    category: str = "jewellery"
    market: str = "Singapore"
    title: str = "Competitor Profile"
    summary: str = ""
    detected_change: Optional[str] = None
    actionable_recommendation: Optional[str] = None
    pricing_summary: Optional[str] = None
    coverage_strengths: Optional[str] = None
    coverage_weaknesses: Optional[str] = None
    underwriter: Optional[str] = None
    target_customer_size: Optional[str] = None
    threat_level: str = "medium"
    social_handles_json: Optional[str] = None
    is_active: bool = True
    relevance: float = 0.5
    source: str = "public_web"
    source_type: Optional[str] = None

class CompetitorCreate(BaseModel):
    name: str
    url: Optional[str] = None
    domain: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = "jewellery"
    market: Optional[str] = "Singapore"
    title: Optional[str] = "Competitor Profile"
    summary: Optional[str] = ""
    detected_change: Optional[str] = None
    actionable_recommendation: Optional[str] = None
    pricing_summary: Optional[str] = None
    coverage_strengths: Optional[str] = None
    coverage_weaknesses: Optional[str] = None
    underwriter: Optional[str] = None
    target_customer_size: Optional[str] = None
    threat_level: Optional[str] = "medium"
    social_handles_json: Optional[str] = None
    is_active: Optional[bool] = True
    relevance: Optional[float] = 0.5
    source: Optional[str] = "public_web"
    source_type: Optional[str] = None

class CompetitorResponse(CompetitorBase):
    id: int
    last_monitored_at: Optional[datetime] = None
    collected_at: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CompetitorSnapshotResponse(BaseModel):
    id: int
    competitor_id: int
    snapshot_date: datetime
    page_url: str
    page_title: Optional[str] = None
    content_hash: Optional[str] = None
    pricing_data: Dict[str, Any] = {}
    coverage_terms: Dict[str, Any] = {}
    public_announcements: List[Dict[str, Any]] = []
    raw_text_excerpt: Optional[str] = None
    captured_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompetitorChangeResponse(BaseModel):
    id: int
    competitor_id: int
    change_type: str
    severity: str
    title: str
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    source_url: Optional[str] = None
    detected_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompetitorBattlecardResponse(BaseModel):
    id: int
    competitor_id: int
    ja_product: str
    why_ja_wins: List[str] = []
    where_competitor_wins: List[str] = []
    objection_handling: Dict[str, str] = {}
    pricing_comparison: Optional[str] = None
    sales_pitch_hook: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompetitorScanResponse(BaseModel):
    competitor_id: int
    status: str
    content_hash: str
    changes_detected: int
    changes: List[CompetitorChangeResponse]
    battlecard_updated: bool

class CompetitiveHookResponse(BaseModel):
    competitor_id: Optional[int] = None
    competitor_name: str
    ja_product: str
    sales_pitch_hook: str
    why_ja_wins: List[str]
    where_competitor_wins: List[str]
    objection_handling: Dict[str, str]
    pricing_comparison: str

# ----------------- Lead DTOs -----------------
class LeadBase(BaseModel):
    name: str = "Decision Maker"
    company: str
    normalized_company_name: Optional[str] = None
    domain: Optional[str] = None
    website: Optional[str] = None
    industry: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    product_fit: Optional[str] = None
    fit_score: float = 0.0
    score_breakdown_json: Optional[str] = None
    why_now: Optional[str] = None
    signals_json: Optional[str] = None
    contacts_json: Optional[str] = None
    qualification_reason: Optional[str] = None
    recommended_brand: Optional[str] = None
    outreach_draft: Optional[str] = None
    source: Optional[str] = "prospecting"
    source_type: Optional[str] = None
    status: str = "new"
    is_demo: bool = False
    campaign_id: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LeadScoreResponse(BaseModel):
    lead_id: int
    score: float
    score_breakdown: Dict[str, Any]
    why_now: Optional[str] = None

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
    approval_rate: float = 0.0
    rejection_rate: float = 0.0
    average_compliance_score: float
    total_leads: int
    average_lead_score: float
    total_lessons_learned: int
    active_lessons_count: int = 0
    total_feedback_count: int = 0
    regeneration_count: int = 0
    brand_breakdown: Dict[str, int]
    platform_breakdown: Dict[str, int]
    language_breakdown: Dict[str, int]
    feedback_reason_frequency: Dict[str, int]
    compliance_score_distribution: Dict[str, int] = Field(default_factory=dict)
    lead_score_distribution: Dict[str, int] = Field(default_factory=dict)
    status_breakdown: Dict[str, int] = Field(default_factory=dict)

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
