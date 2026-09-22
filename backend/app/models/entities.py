from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
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
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    brand: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True) # jade, doctorshield, jaguartransit
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # jewellery, medical, transit, etc.
    market: Mapped[str] = mapped_column(String(100), default="Singapore")
    title: Mapped[str] = mapped_column(String(255), default="Competitor Profile")
    summary: Mapped[str] = mapped_column(Text, default="")
    detected_change: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actionable_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pricing_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coverage_strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coverage_weaknesses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    underwriter: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    target_customer_size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # SME, Enterprise, HNW, Solo Specialist
    threat_level: Mapped[str] = mapped_column(String(40), default="medium", index=True) # high, medium, low
    social_handles_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    relevance: Mapped[float] = mapped_column(Float, default=0.5)
    source: Mapped[str] = mapped_column(String(100), default="public_web")
    last_monitored_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    snapshots: Mapped[List["CompetitorSnapshot"]] = relationship("CompetitorSnapshot", back_populates="competitor", cascade="all, delete-orphan")
    changes: Mapped[List["CompetitorChange"]] = relationship("CompetitorChange", back_populates="competitor", cascade="all, delete-orphan")
    battlecards: Mapped[List["CompetitorBattlecard"]] = relationship("CompetitorBattlecard", back_populates="competitor", cascade="all, delete-orphan")

    @property
    def source_type(self) -> str:
        if self.source in ["VERIFIED_SOURCE", "AI_ANALYSIS", "DEMO_DATA"]:
            return self.source
        if "live" in (self.source or "").lower() or (self.url and "http" in self.url):
            return "VERIFIED_SOURCE"
        return "DEMO_DATA"

    @property
    def website_url(self) -> str:
        return self.url or ""

    @website_url.setter
    def website_url(self, value: str):
        self.url = value

    @property
    def niche(self) -> str:
        return self.category

    @niche.setter
    def niche(self, value: str):
        self.category = value

    @property
    def social_handles(self) -> dict:
        if self.social_handles_json:
            try:
                import json
                return json.loads(self.social_handles_json)
            except Exception:
                return {}
        return {}

    @social_handles.setter
    def social_handles(self, value: Any):
        import json
        if isinstance(value, dict):
            self.social_handles_json = json.dumps(value)
        elif isinstance(value, str):
            self.social_handles_json = value
        else:
            self.social_handles_json = None


class CompetitorSnapshot(Base):
    __tablename__ = "competitor_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(Integer, ForeignKey("competitors.id", ondelete="CASCADE"), index=True)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)
    page_url: Mapped[str] = mapped_column(String(500), nullable=False)
    page_title: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    pricing_data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coverage_terms_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    public_announcements_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_text_excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    competitor: Mapped["Competitor"] = relationship("Competitor", back_populates="snapshots")

    @property
    def pricing_data(self) -> dict:
        if self.pricing_data_json:
            try:
                import json
                return json.loads(self.pricing_data_json)
            except Exception:
                return {}
        return {}

    @pricing_data.setter
    def pricing_data(self, value: Any):
        import json
        if isinstance(value, dict):
            self.pricing_data_json = json.dumps(value)
        elif isinstance(value, str):
            self.pricing_data_json = value
        else:
            self.pricing_data_json = None

    @property
    def coverage_terms(self) -> dict:
        if self.coverage_terms_json:
            try:
                import json
                return json.loads(self.coverage_terms_json)
            except Exception:
                return {}
        return {}

    @coverage_terms.setter
    def coverage_terms(self, value: Any):
        import json
        if isinstance(value, dict):
            self.coverage_terms_json = json.dumps(value)
        elif isinstance(value, str):
            self.coverage_terms_json = value
        else:
            self.coverage_terms_json = None

    @property
    def public_announcements(self) -> list:
        if self.public_announcements_json:
            try:
                import json
                return json.loads(self.public_announcements_json)
            except Exception:
                return []
        return []

    @public_announcements.setter
    def public_announcements(self, value: Any):
        import json
        if isinstance(value, list):
            self.public_announcements_json = json.dumps(value)
        elif isinstance(value, str):
            self.public_announcements_json = value
        else:
            self.public_announcements_json = None


class CompetitorChange(Base):
    __tablename__ = "competitor_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(Integer, ForeignKey("competitors.id", ondelete="CASCADE"), index=True)
    change_type: Mapped[str] = mapped_column(String(80), index=True) # pricing_change, coverage_update, social_campaign, new_product, expansion
    severity: Mapped[str] = mapped_column(String(40), default="major", index=True) # critical, major, minor
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)

    competitor: Mapped["Competitor"] = relationship("Competitor", back_populates="changes")


class CompetitorBattlecard(Base):
    __tablename__ = "competitor_battlecards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    competitor_id: Mapped[int] = mapped_column(Integer, ForeignKey("competitors.id", ondelete="CASCADE"), index=True)
    ja_product: Mapped[str] = mapped_column(String(80), index=True) # Jade, Jaguar Transit, DoctorShield
    why_ja_wins_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    where_competitor_wins_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objection_handling_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pricing_comparison: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sales_pitch_hook: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    competitor: Mapped["Competitor"] = relationship("Competitor", back_populates="battlecards")

    @property
    def why_ja_wins(self) -> list:
        if self.why_ja_wins_json:
            try:
                import json
                return json.loads(self.why_ja_wins_json)
            except Exception:
                return []
        return []

    @why_ja_wins.setter
    def why_ja_wins(self, value: Any):
        import json
        if isinstance(value, list):
            self.why_ja_wins_json = json.dumps(value)
        elif isinstance(value, str):
            self.why_ja_wins_json = value
        else:
            self.why_ja_wins_json = None

    @property
    def where_competitor_wins(self) -> list:
        if self.where_competitor_wins_json:
            try:
                import json
                return json.loads(self.where_competitor_wins_json)
            except Exception:
                return []
        return []

    @where_competitor_wins.setter
    def where_competitor_wins(self, value: Any):
        import json
        if isinstance(value, list):
            self.where_competitor_wins_json = json.dumps(value)
        elif isinstance(value, str):
            self.where_competitor_wins_json = value
        else:
            self.where_competitor_wins_json = None

    @property
    def objection_handling(self) -> dict:
        if self.objection_handling_json:
            try:
                import json
                return json.loads(self.objection_handling_json)
            except Exception:
                return {}
        return {}

    @objection_handling.setter
    def objection_handling(self, value: Any):
        import json
        if isinstance(value, dict):
            self.objection_handling_json = json.dumps(value)
        elif isinstance(value, str):
            self.objection_handling_json = value
        else:
            self.objection_handling_json = None



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


class ExecutiveDigest(Base):
    """
    Executive Competitor & Market Intelligence Digest.
    Synthesizes observed competitor shifts, pricing anomalies, warranty gaps,
    and lead signals into an actionable four-pillar strategic action plan for JA Assure.
    """
    __tablename__ = "executive_digests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    brand: Mapped[str] = mapped_column(String(50), default="all", index=True) # all, jade, doctorshield, jaguartransit
    market: Mapped[str] = mapped_column(String(100), default="Singapore", index=True) # Singapore, Malaysia, Hong Kong, Thailand, Indonesia
    niche: Mapped[str] = mapped_column(String(80), default="all", index=True) # all, jewellery, transit, medical
    period_start: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    period_end: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    what_ja_should_do: Mapped[str] = mapped_column(Text, nullable=False) # 4-Pillar Action Blueprint
    key_changes_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Competitor shifts analyzed
    lead_signals_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Lead discovery signals analyzed
    digest_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Full structured JSON payload
    source_count: Mapped[int] = mapped_column(Integer, default=0)
    model: Mapped[Optional[str]] = mapped_column(String(100), default="Groq (Llama-3/Compound)")
    status: Mapped[str] = mapped_column(String(40), default="published", index=True) # draft, published, archived
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    @property
    def executive_briefing(self) -> str:
        return self.executive_summary or ""

    @property
    def total_shifts_analyzed(self) -> int:
        if self.key_changes_json:
            try:
                import json
                items = json.loads(self.key_changes_json)
                return len(items) if isinstance(items, list) else 0
            except Exception:
                return 0
        return 0

    @property
    def changes_analyzed(self) -> list:
        if self.key_changes_json:
            try:
                import json
                return json.loads(self.key_changes_json)
            except Exception:
                return []
        return []

    @property
    def lead_signals_analyzed(self) -> list:
        if self.lead_signals_json:
            try:
                import json
                return json.loads(self.lead_signals_json)
            except Exception:
                return []
        return []

    def _extract_pillar_points(self, *keywords: str) -> list[str]:
        """Extracts actionable bullet points for a specific pillar from what_ja_should_do or digest_json."""
        if self.digest_json:
            try:
                import json
                d = json.loads(self.digest_json)
                for key in ["pillars", "strategic_pillars", "playbook"]:
                    if key in d and isinstance(d[key], dict):
                        for kw in keywords:
                            for p_key, points in d[key].items():
                                if kw.lower() in p_key.lower() and isinstance(points, list):
                                    return [str(p) for p in points if p]
            except Exception:
                pass

        if not self.what_ja_should_do:
            return ["Review baseline rating and underwriting matrix."]

        # Parse markdown headers
        lines = self.what_ja_should_do.splitlines()
        capturing = False
        points = []
        for line in lines:
            line_str = line.strip()
            if line_str.startswith("#"):
                # Check if this section header matches any of our keywords
                header_matches = any(kw.lower() in line_str.lower() for kw in keywords)
                if header_matches:
                    capturing = True
                    continue
                else:
                    capturing = False
            elif capturing and line_str:
                if line_str.startswith(("-", "*", "•")) or (len(line_str) > 2 and line_str[0].isdigit() and line_str[1] in (".", ")")):
                    clean = line_str.lstrip("-*•0123456789. )")
                    if clean:
                        points.append(clean)

        if points:
            return points[:5]

        # Fallback snippet if specific bullet extraction produced empty
        return [f"Execute strategic action across {keywords[0]}."]

    @property
    def pricing_strategy_points(self) -> list[str]:
        return self._extract_pillar_points("pricing", "rate", "1.")

    @property
    def underwriting_tweaks(self) -> list[str]:
        return self._extract_pillar_points("underwriting", "wording", "coverage", "2.")

    @property
    def battlecard_updates(self) -> list[str]:
        return self._extract_pillar_points("battlecard", "outreach", "sales", "displacement", "3.")

    @property
    def marketing_campaign_ideas(self) -> list[str]:
        return self._extract_pillar_points("marketing", "campaign", "positioning", "4.")

