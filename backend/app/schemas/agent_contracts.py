from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# ========================================================
# 1. Research & Competitor Insights
# ========================================================

class CompetitorInsight(BaseModel):
    competitor_name: str
    category: str
    key_messaging: str
    detected_change: Optional[str] = None
    opportunity: Optional[str] = None
    threat_level: str = "medium" # low, medium, high
    source_url: Optional[str] = None

class ResearchInsight(BaseModel):
    brand: str # jade, doctorshield, jaguartransit
    topic: str
    market_context: str
    target_audience: str
    pain_points: List[str] = Field(default_factory=list)
    competitor_insights: List[CompetitorInsight] = Field(default_factory=list)
    recommended_angles: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)


# ========================================================
# 2. Content Generation Contracts
# ========================================================

class ContentBrief(BaseModel):
    brand: str
    platform: str # linkedin, instagram, facebook, tiktok, twitter, blog
    content_type: str = "post" # post, reel, carousel, article, thread
    topic: str
    target_persona: Optional[str] = None
    tone_guidelines: Optional[str] = None
    key_benefits: List[str] = Field(default_factory=list)
    cta: Optional[str] = None
    language: str = "en" # en, ms, id, th, zh
    variations_count: int = 2
    context_lessons: List[str] = Field(default_factory=list) # Lessons learned injected from past human feedback

class GeneratedVariation(BaseModel):
    variation_label: str # e.g. "A", "B"
    content_text: str
    headline: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    cta: Optional[str] = None
    media_prompt: Optional[str] = None # prompt for AI image or video storyboard


# ========================================================
# 3. Compliance Gate Contracts
# ========================================================

class ComplianceViolation(BaseModel):
    rule_id: str
    severity: str # critical, warning, info
    message: str
    flagged_phrase: Optional[str] = None
    suggested_fix: Optional[str] = None

class ComplianceResult(BaseModel):
    passed: bool
    score: float = Field(ge=0.0, le=100.0) # 0 to 100
    violations: List[ComplianceViolation] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    overall_feedback: str = ""
    disclaimers_required: List[str] = Field(default_factory=list)


# ========================================================
# 4. Human Review & Feedback Loop Contracts
# ========================================================

class HumanReviewAction(BaseModel):
    content_id: int
    action: str # approve, reject, edit
    reason_tag: Optional[str] = None # e.g. "misleading_guarantee", "tone_off", "pricing_claim", "inaccurate_coverage"
    notes: Optional[str] = None
    corrected_content: Optional[str] = None
    reviewer: Optional[str] = "compliance_officer"

class FeedbackRecord(BaseModel):
    id: Optional[int] = None
    content_id: int
    reason_tag: str
    notes: str
    original_content: str
    corrected_content: Optional[str] = None
    created_at: Optional[datetime] = None

class LessonLearned(BaseModel):
    id: Optional[int] = None
    category: str # compliance, tone, brand_voice, regional_nuance
    lesson: str
    examples: Optional[str] = None
    frequency: int = 1
    active: bool = True


# ========================================================
# 5. Lead Intelligence Contracts
# ========================================================

class LeadProspect(BaseModel):
    name: str
    company: str
    industry: str
    email: Optional[str] = None
    location: Optional[str] = None
    company_size: Optional[str] = None
    fit_score: float = 0.0
    qualification_reason: Optional[str] = None
    outreach_draft: Optional[str] = None
    source: Optional[str] = "agent_prospector"


# ========================================================
# 6. Publishing Contracts
# ========================================================

class PublishingSchedule(BaseModel):
    content_id: int
    platform: str
    scheduled_at: Optional[datetime] = None
    auto_publish: bool = False
