from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class ContentQueue(Base):
    __tablename__ = "content_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # jade, doctorshield, jaguartransit
    platform: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # linkedin, instagram, facebook, tiktok, etc.
    content_type: Mapped[str] = mapped_column(String(50), default="post") # post, reel, carousel, article, ad
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    content_raw: Mapped[str] = mapped_column(Text, nullable=False)
    variation: Mapped[str] = mapped_column(String(50), default="A") # A, B, default
    language: Mapped[str] = mapped_column(String(10), default="en") # en, ms, id, th, zh
    compliance_status: Mapped[str] = mapped_column(String(50), default="pending", index=True) # pending, passed, flagged, failed
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True) # pending, compliance_checked, human_review, approved, rejected, scheduled, published
    compliance_score: Mapped[float] = mapped_column(Float, default=0.0)
    reason_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # compliance or rejection reason
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # video script, prompt metadata, etc.
    # Immutable snapshot of the very first AI-generated text. Set once, never overwritten,
    # so the original generation survives any number of human edits/rewrites/regenerations.
    original_content_raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    feedbacks: Mapped[List["Feedback"]] = relationship("Feedback", back_populates="content_item", cascade="all, delete-orphan")
    publishing_records: Mapped[List["PublishingRecord"]] = relationship("PublishingRecord", back_populates="content_item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_content_brand_platform", "brand", "platform"),
        Index("ix_content_status_compliance", "status", "compliance_status"),
    )


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # jewellery, medical, transit, etc.
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    detected_change: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actionable_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    relevance: Mapped[float] = mapped_column(Float, default=0.5)
    source: Mapped[str] = mapped_column(String(100), default="public_web")
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    @property
    def source_type(self) -> str:
        if self.source in ["VERIFIED_SOURCE", "AI_ANALYSIS", "DEMO_DATA"]:
            return self.source
        if "live" in (self.source or "").lower() or (self.url and "http" in self.url):
            return "VERIFIED_SOURCE"
        return "DEMO_DATA"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="Decision Maker") # Contact / Key Person
    company: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    normalized_company_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_fit: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fit_score: Mapped[float] = mapped_column(Float, default=0.0) # 0 to 100
    score_breakdown_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    why_now: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signals_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contacts_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qualification_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_brand: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # jade, doctorshield, jaguartransit
    outreach_draft: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), default="prospecting")
    status: Mapped[str] = mapped_column(String(50), default="new", index=True) # new, contacted, qualified, converted, archived
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    campaign_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    last_contacted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    @property
    def company_name(self) -> str:
        return self.company

    @company_name.setter
    def company_name(self, value: str):
        self.company = value

    @property
    def score(self) -> float:
        return self.fit_score

    @score.setter
    def score(self, value: float):
        self.fit_score = value

    @property
    def source_type(self) -> str:
        if self.is_demo:
            return "DEMO_DATA"
        if self.source in ["VERIFIED_SOURCE", "AI_GENERATED_PROSPECT", "DEMO_DATA", "google_places", "gemini_market_intel"]:
            return self.source
        if "prospect" in (self.source or "").lower() or "agent" in (self.source or "").lower():
            return "AI_GENERATED_PROSPECT"
        if self.source and "http" in self.source:
            return "VERIFIED_SOURCE"
        return "DEMO_DATA"


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    content_id: Mapped[int] = mapped_column(Integer, ForeignKey("content_queue.id", ondelete="CASCADE"), index=True)
    reason_tag: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # e.g. "claim_unsubstantiated", "tone_off", "pricing_disclaimer_missing"
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    content_item: Mapped["ContentQueue"] = relationship("ContentQueue", back_populates="feedbacks")


class LessonLearned(Base):
    __tablename__ = "lessons_learned"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # compliance, tone, platform, audience
    lesson: Mapped[str] = mapped_column(Text, nullable=False)
    examples: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    frequency: Mapped[int] = mapped_column(Integer, default=1)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    @property
    def lesson_rule(self) -> str:
        return self.lesson

    @property
    def is_active(self) -> bool:
        return self.active


class Analytics(Base):
    __tablename__ = "analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    metric_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    metric_value: Mapped[float] = mapped_column(Float, default=0.0)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class PublishingRecord(Base):
    __tablename__ = "publishing_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    content_id: Mapped[int] = mapped_column(Integer, ForeignKey("content_queue.id", ondelete="CASCADE"), index=True)
    platform: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    external_post_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), index=True, default="scheduled") # scheduled, publishing, published, failed
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    engagement_metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON string of impressions, clicks, etc.
    error_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    content_item: Mapped["ContentQueue"] = relationship("ContentQueue", back_populates="publishing_records")


class ReviewDecision(Base):
    """
    Immutable audit log of every human-in-the-loop decision made on any governed asset.
    Deliberately polymorphic (asset_type + asset_id, no FK) so the SAME HITL boundary can
    eventually govern the Content Queue, Lead/Outreach drafts, and Competitor recommendations
    without a schema change per workflow. For today's Content Queue usage, asset_id == content_queue.id.
    """
    __tablename__ = "review_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_type: Mapped[str] = mapped_column(String(50), index=True, default="content_queue") # content_queue, lead_outreach, competitor_recommendation
    asset_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    reviewer: Mapped[str] = mapped_column(String(100), default="compliance_officer")
    decision: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # approve, reject, edit, rewrite, regenerate
    reason_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    original_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # version immediately before this decision
    edited_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # version immediately after this decision (edit/rewrite/regenerate only)
    compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    previous_status: Mapped[str] = mapped_column(String(50), nullable=False)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)

    __table_args__ = (
        Index("ix_review_decisions_asset", "asset_type", "asset_id"),
    )
