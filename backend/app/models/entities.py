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


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # Contact / Key Person
    company: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    industry: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fit_score: Mapped[float] = mapped_column(Float, default=0.0) # 0 to 100
    qualification_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_brand: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # jade, doctorshield, jaguartransit
    outreach_draft: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), default="prospecting")
    status: Mapped[str] = mapped_column(String(50), default="new", index=True) # new, contacted, qualified, converted, archived
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


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
