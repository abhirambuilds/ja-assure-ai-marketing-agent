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

class LeadScoringBreakdown(BaseModel):
    industry_fit: float = Field(ge=0, le=25, description="Weight 25%: Industry alignment with JA Assure products")
    company_profile: float = Field(ge=0, le=20, description="Weight 20%: Size, reputation, transaction volume")
    geographic_relevance: float = Field(ge=0, le=20, description="Weight 20%: SG, MY, TH, ID jurisdiction presence")
    product_relevance: float = Field(ge=0, le=20, description="Weight 20%: Need for Jewellery, Med Indemnity, or Transit Cargo")
    potential_insurance_need: float = Field(ge=0, le=15, description="Weight 15%: Exposure to liability, theft, or port risk")
    total_fit_score: float = Field(ge=0, le=100)

class LeadProspect(BaseModel):
    name: str
    company: str
    industry: str
    email: Optional[str] = None
    location: Optional[str] = None
    company_size: Optional[str] = None
    recommended_brand: Optional[str] = None # jade, doctorshield, jaguartransit
    fit_score: float = 0.0
    qualification_reason: Optional[str] = None
    outreach_draft: Optional[str] = None
    source: Optional[str] = "agent_prospector"
    scoring_breakdown: Optional[LeadScoringBreakdown] = None


# ========================================================
# 6. Video / Reels Contracts
# ========================================================

class VideoScene(BaseModel):
    scene_number: int
    duration_seconds: int = 10
    visual_description: str
    voiceover: str
    onscreen_text: str

class VideoScript(BaseModel):
    brand: str
    concept: str
    target_duration_seconds: int = 45 # 30-60s
    voiceover_tone: str
    scenes: List[VideoScene] = Field(default_factory=list)
    cta: str
    disclaimer: str
    media_status: str = "pending_render" # pending_render, rendered, mock_rendered


# ========================================================
# 7. Publishing & Suite Contracts
# ========================================================

class PublishingSchedule(BaseModel):
    content_id: int
    platform: str
    scheduled_at: Optional[datetime] = None
    auto_publish: bool = False

class ContentSuiteRequest(BaseModel):
    brand: str # jade, doctorshield, jaguartransit
    topic: str
    key_benefits: List[str] = Field(default_factory=list)
    platforms: List[str] = Field(default=["linkedin", "instagram"])
    content_types: List[str] = Field(default=["post", "reel"])
    languages: List[str] = Field(default=["en"])
    generate_ab_variations: bool = True
    context_lessons: Optional[List[str]] = None

