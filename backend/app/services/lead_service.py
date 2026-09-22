from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.entities import Lead
from app.schemas.agent_contracts import (
    LeadProspect,
    LeadScoringBreakdown,
)
from app.services.deduplication import DeduplicationService
from app.services.discovery.base import (
    CandidateCompany,
    Contact,
    DiscoveryRequest,
    ScoreResult,
    Signal,
)
from app.services.discovery.config import get_brand_config
from app.services.discovery.google_places import GooglePlacesProvider
from app.services.discovery.industry_sources import IndustrySourceProvider, get_demo_candidates
from app.services.discovery.market_intel import MarketIntelDiscoveryProvider
from app.services.enrichment.company_verifier import CompanyVerifier
from app.services.enrichment.contacts import DemoContactProvider, HunterContactProvider
from app.services.enrichment.normalization import (
    normalize_company_name,
    normalize_domain,
    normalize_phone,
)
from app.services.enrichment.role_selector import DecisionMakerRoleSelector
from app.services.enrichment.website_inspector import WebsiteInspector
from app.services.llm_provider import llm_provider
from app.services.scoring.lead_scorer import LeadScorer
from app.services.signals.classifier import SignalClassifier
from app.services.signals.detector import SignalDetector

logger = logging.getLogger("ja_assure.leads")


class LeadService:
    """Lead Discovery, Deterministic 5-Factor Scoring, and Contextual Outreach Engine.

    Integrates:
    - Multi-source discovery (Google Places API v1 searchText, Market Intel via Groq, Verified Industry Directories)
    - Brand-specific query expansion (Jade, Jaguar Transit, DoctorShield)
    - Normalization & 4-stage deduplication (domain, source id, phone, name)
    - SSRF-safe website inspection
    - Role & contact selection (Hunter.io + demo fallback)
    - Evidence-backed signal detection & 'Why Now' explanation
    - Deterministic 5-factor scoring (0-100) with explainable breakdowns
    - Persistence to PostgreSQL / Supabase
    """

    def __init__(self):
        self.deduplicator = DeduplicationService()
        self.inspector = WebsiteInspector()
        self.hunter = HunterContactProvider()
        self.demo_contacts = DemoContactProvider()

    # -------------------------------------------------------------------------
    # 1. Multi-source Discovery
    # -------------------------------------------------------------------------
    def discover(self, request: DiscoveryRequest) -> List[CandidateCompany]:
        """Query all discovery providers and aggregate raw candidate companies."""
        candidates: List[CandidateCompany] = []

        # 1. Google Places (live when API key is provided)
        try:
            places_provider = GooglePlacesProvider()
            places_results = places_provider.discover(request)
            if places_results:
                logger.info(f"Google Places discovered {len(places_results)} leads for {request.brand}")
                candidates.extend(places_results)
        except Exception as e:
            logger.warning(f"Google Places discovery error: {e}")

        # 2. Market Intelligence (via LLM when live)
        try:
            market_provider = MarketIntelDiscoveryProvider()
            market_results = market_provider.discover(request)
            if market_results:
                logger.info(f"Market Intel discovered {len(market_results)} leads for {request.brand}")
                candidates.extend(market_results)
        except Exception as e:
            logger.warning(f"Market Intel discovery error: {e}")

        # 3. Verified Industry Directories & Demo Pool fallback
        if not candidates or len(candidates) < 3:
            try:
                industry_provider = IndustrySourceProvider()
                industry_results = industry_provider.discover(request)
                candidates.extend(industry_results)
            except Exception as e:
                logger.warning(f"Industry source discovery error: {e}")

        return candidates

    # -------------------------------------------------------------------------
    # 2. Normalization
    # -------------------------------------------------------------------------
    def normalize(self, candidates: List[CandidateCompany]) -> List[CandidateCompany]:
        """Normalize company names, domains, and phone numbers across candidates."""
        for c in candidates:
            c.domain = normalize_domain(c.domain)
            c.phone = normalize_phone(c.phone)
        return candidates

    # -------------------------------------------------------------------------
    # 3. Deduplication (4-Stage Hierarchy)
    # -------------------------------------------------------------------------
    def deduplicate(self, candidates: List[CandidateCompany]) -> List[CandidateCompany]:
        """Apply 4-stage deduplication: domain -> provider ID -> phone -> normalized company name."""
        return self.deduplicator.deduplicate(candidates)

    # -------------------------------------------------------------------------
    # 4. Website Inspection (SSRF-Safe)
    # -------------------------------------------------------------------------
    def inspect_website(self, domain: Optional[str]) -> Optional[str]:
        """Inspect company website with SSRF protection, timeout, and byte limit."""
        return self.inspector.inspect(domain)

    # -------------------------------------------------------------------------
    # 5. Contact & Role Discovery
    # -------------------------------------------------------------------------
    def enrich_contacts(self, candidate: CandidateCompany, brand: str) -> List[Contact]:
        """Find decision-maker roles and contacts via Hunter.io or demo fallback."""
        brand_cfg = get_brand_config(brand)
        role_selector = DecisionMakerRoleSelector(brand_cfg)
        target_roles = role_selector.roles_for(candidate)

        # Try Hunter.io if live
        contacts = self.hunter.find_contacts(candidate, target_roles)
        if not contacts and candidate.is_demo:
            contacts = self.demo_contacts.find_contacts(candidate, target_roles)

        return contacts

    # -------------------------------------------------------------------------
    # 6. Signal Detection & Why Now
    # -------------------------------------------------------------------------
    def detect_signals(self, candidate: CandidateCompany, brand: str) -> List[Signal]:
        """Extract evidence-backed expansion, milestone, and growth signals."""
        brand_cfg = get_brand_config(brand)
        classifier = SignalClassifier(brand_cfg)
        detector = SignalDetector(classifier)
        return detector.detect(candidate)

    def explain_why_now(self, company_name: str, signals: List[Signal], brand: str) -> Optional[str]:
        """Synthesize a cautious, compliant 'Why Now' underwriting opportunity statement."""
        brand_cfg = get_brand_config(brand)
        classifier = SignalClassifier(brand_cfg)
        detector = SignalDetector(classifier)
        return detector.why_now(company_name, signals, brand)

    # -------------------------------------------------------------------------
    # 7. Deterministic 5-Factor Scoring
    # -------------------------------------------------------------------------
    def score(
        self,
        candidate: CandidateCompany,
        brand: str,
        signals: Optional[List[Signal]] = None,
        contacts: Optional[List[Contact]] = None,
    ) -> ScoreResult:
        """Calculate deterministic 0-100 score across 5 explainable factors."""
        brand_cfg = get_brand_config(brand)
        scorer = LeadScorer(brand_cfg)
        return scorer.score(
            industry=candidate.industry,
            country=candidate.country,
            market=candidate.country or "Singapore",
            product_fit=brand_cfg.product,
            signals=signals or [],
            contacts=contacts or [],
            has_description=bool(candidate.description),
        )

    # -------------------------------------------------------------------------
    # 8. Persistence to Database
    # -------------------------------------------------------------------------
    def persist(
        self,
        db: Session,
        candidate: CandidateCompany,
        brand: str,
        score_res: ScoreResult,
        why_now: Optional[str],
        signals: List[Signal],
        contacts: List[Contact],
        outreach: Optional[str],
    ) -> Lead:
        """Upsert lead into database with full discovery provenance, score breakdown, and triggers."""
        norm_name = normalize_company_name(candidate.company_name)
        norm_dom = normalize_domain(candidate.domain)

        # Check existing by domain, then normalized company name
        existing: Optional[Lead] = None
        if norm_dom:
            existing = db.execute(select(Lead).where(Lead.domain == norm_dom)).scalars().first()
        if not existing and norm_name:
            existing = db.execute(select(Lead).where(Lead.normalized_company_name == norm_name)).scalars().first()
        if not existing:
            existing = db.execute(select(Lead).where(Lead.company == candidate.company_name)).scalars().first()

        score_val = float(score_res.total)
        status_val = "qualified" if score_val >= 75 else "new"
        qualification_msg = why_now or candidate.description or f"Qualified via {candidate.source_provider}"

        # Contact name
        contact_name = "Decision Maker"
        email_val = None
        if contacts:
            c = contacts[0]
            if c.name:
                contact_name = f"{c.name} ({c.role})" if c.role else c.name
            elif c.role:
                contact_name = c.role.title()
            email_val = c.email

        breakdown_json = json.dumps(score_res.breakdown)
        signals_json = json.dumps([s.model_dump(mode="json") for s in signals]) if signals else None
        contacts_json = json.dumps([c.model_dump(mode="json") for c in contacts]) if contacts else None

        if existing:
            existing.fit_score = score_val
            existing.score_breakdown_json = breakdown_json
            existing.why_now = why_now
            existing.signals_json = signals_json
            existing.contacts_json = contacts_json
            existing.qualification_reason = qualification_msg
            existing.outreach_draft = outreach or existing.outreach_draft
            existing.source = candidate.source_provider
            existing.is_demo = candidate.is_demo
            if candidate.description:
                existing.description = candidate.description
            if candidate.address and not existing.address:
                existing.address = candidate.address
            if candidate.phone and not existing.phone:
                existing.phone = candidate.phone
            if candidate.domain and not existing.domain:
                existing.domain = candidate.domain
                existing.website = f"https://{candidate.domain}"
            if email_val and not existing.email:
                existing.email = email_val
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_lead = Lead(
                name=contact_name,
                company=candidate.company_name,
                normalized_company_name=norm_name,
                domain=norm_dom,
                website=f"https://{norm_dom}" if norm_dom else None,
                industry=candidate.industry or "commercial",
                email=email_val,
                phone=candidate.phone,
                location=candidate.city or candidate.country or "Singapore",
                country=candidate.country or "Singapore",
                city=candidate.city or "Singapore",
                address=candidate.address,
                description=candidate.description,
                product_fit=brand,
                fit_score=score_val,
                score_breakdown_json=breakdown_json,
                why_now=why_now,
                signals_json=signals_json,
                contacts_json=contacts_json,
                qualification_reason=qualification_msg,
                recommended_brand=brand,
                outreach_draft=outreach,
                source=candidate.source_provider,
                status=status_val,
                is_demo=candidate.is_demo,
            )
            db.add(new_lead)
            db.commit()
            db.refresh(new_lead)
            return new_lead

    # -------------------------------------------------------------------------
    # Backward Compatible Scoring & Outreach Helpers
    # -------------------------------------------------------------------------
    def calculate_score(
        self,
        industry: str,
        company: str,
        location: str,
        company_size: Optional[str] = None,
        brand: Optional[str] = None,
    ) -> LeadScoringBreakdown:
        """Transparent 5-factor scoring model totaling 0-100 with dimensional rationales."""
        brand_clean = (brand or "doctorshield").lower()
        brand_cfg = get_brand_config(brand_clean)
        scorer = LeadScorer(brand_cfg)
        res = scorer.score(
            industry=industry,
            country=location,
            market=location or "Singapore",
            product_fit=brand_cfg.product,
            has_description=bool(company),
        )
        bd = res.breakdown
        return LeadScoringBreakdown(
            industry_fit=float(bd.get("industry_fit", 20)),
            company_profile=float(bd.get("company_relevance", 15)),
            geographic_relevance=float(bd.get("geographic_fit", 15)),
            product_relevance=float(bd.get("product_fit", 15)),
            potential_insurance_need=float(bd.get("trigger_strength", 10)),
            total_fit_score=float(res.total),
            industry_fit_reason=f"Alignment with {brand_clean.title()} underwriting criteria.",
            company_profile_reason="Commercial enterprise profile qualified for niche coverage.",
            geographic_relevance_reason=f"Operating within {location or 'core ASEAN underwriting markets'}.",
            product_relevance_reason=f"Policy structure matched to {brand_clean.title()} facility.",
            potential_insurance_need_reason="Risk exposure derived from verified operational profile.",
        )

    def generate_outreach(
        self,
        prospect_name: str,
        company: str,
        brand: str,
        industry: str,
        location: Optional[str] = None,
        research_context: Optional[str] = None,
        risk_exposure: Optional[str] = None,
    ) -> str:
        """Generate tailored B2B outreach messaging adhering to brand voice."""
        loc_str = f" in {location}" if location else ""
        context_str = f" In light of recent milestones ({research_context}), " if research_context else " "
        risk_str = f" Regarding {risk_exposure}, " if risk_exposure else ""

        brand_clean = (brand or "doctorshield").lower()

        if "jade" in brand_clean:
            return (
                f"Dear {prospect_name},\n\n"
                f"We have been following {company}'s distinguished presence in {industry}{loc_str}.{context_str}"
                f"{risk_str}as bespoke high-value collections frequently exceed conventional policy sub-limits, "
                f"Jade by JA Assure provides agreed-value protection with zero-deductible coverage and seamless exhibition transit.\n\n"
                f"Would you be open to a brief 5-minute private consultation on safeguarding your clients' rare collector inventory?\n\n"
                f"Warm regards,\nJA Assure Jade Advisory"
            )
        elif "transit" in brand_clean or "jaguar" in brand_clean:
            return (
                f"Dear {prospect_name},\n\n"
                f"In high-value freight forwarding across regional trade corridors{loc_str},{context_str}"
                f"{risk_str}unexpected transit bottlenecks and unmonitored transfer handoffs introduce balance-sheet exposure. "
                f"Jaguar Transit offers vault-grade door-to-door cargo insurance with active GPS escort protection.\n\n"
                f"We would welcome the opportunity to review {company}'s primary transit routes to optimize cargo deductibles.\n\n"
                f"Best regards,\nJaguar Transit Operations"
            )
        else: # doctorshield
            return (
                f"Dear {prospect_name},\n\n"
                f"Given {company}'s active procedural focus in {industry}{loc_str},{context_str}"
                f"{risk_str}maintaining comprehensive medical professional indemnity with immediate access to panel legal counsel is essential for career protection.\n\n"
                f"DoctorShield offers tailored retroactive liability coverage specifically structured for private medical practitioners and specialist clinics. "
                f"We would welcome the opportunity to share our concise indemnity overview.\n\n"
                f"Respectfully,\nDoctorShield Medico-Legal Partnerships"
            )

    # -------------------------------------------------------------------------
    # 9. Main Orchestrated Discovery Pipeline
    # -------------------------------------------------------------------------
    async def discover_and_score_leads(
        self,
        brand: Optional[str] = None,
        country: Optional[str] = None,
        industry: Optional[str] = None,
        target_audience: Optional[str] = None,
        keywords: Optional[str] = None,
    ) -> List[LeadProspect]:
        """Main orchestrated discovery pipeline integrating multi-source discovery,

        verification, 4-stage deduplication, website inspection, signal detection,
        deterministic 5-factor scoring, Why Now explanation, and persistence.
        """
        brand_clean = (brand or "doctorshield").lower()
        market = country or "Singapore"
        db = SessionLocal()
        results: List[LeadProspect] = []

        try:
            req = DiscoveryRequest(
                brand=brand_clean,
                market=market,
                target_industry=industry,
                target_count=15,
                keywords=keywords,
            )

            # 1. Multi-source Discovery
            raw_candidates = self.discover(req)

            # 2. Company Verification
            brand_cfg = get_brand_config(brand_clean)
            verifier = CompanyVerifier(brand_cfg)
            verified = [c for c in raw_candidates if verifier.is_relevant(c, market)]
            if not verified:
                verified = raw_candidates  # Graceful fallback if overly strict

            # 3. Normalization & 4-Stage Deduplication
            normalized = self.normalize(verified)
            unique_candidates = self.deduplicate(normalized)

            # 4. Enrich each candidate (website inspection, contacts, signals, deterministic score, why-now)
            for cand in unique_candidates[:15]:
                # Website inspection (SSRF safe) - skip for synthetic demo domains
                if not cand.is_demo and cand.domain and not cand.description:
                    site_text = self.inspect_website(cand.domain)
                    if site_text:
                        cand.description = site_text[:200]

                # Contacts discovery
                contacts = self.enrich_contacts(cand, brand_clean)

                # Signal detection & Why Now
                signals = self.detect_signals(cand, brand_clean)
                why_now = self.explain_why_now(cand.company_name, signals, brand_clean)

                # Deterministic 5-factor score
                score_res = self.score(cand, brand_clean, signals=signals, contacts=contacts)

                # Contextual outreach
                contact_display = contacts[0].name or cand.company_name if contacts else cand.company_name
                outreach = self.generate_outreach(
                    prospect_name=contact_display,
                    company=cand.company_name,
                    brand=brand_clean,
                    industry=cand.industry or "commercial",
                    location=cand.city or market,
                    research_context=why_now[:120] if why_now else None,
                )

                # Persist to database
                persisted_lead = self.persist(
                    db=db,
                    candidate=cand,
                    brand=brand_clean,
                    score_res=score_res,
                    why_now=why_now,
                    signals=signals,
                    contacts=contacts,
                    outreach=outreach,
                )

                # Formulate LeadScoringBreakdown DTO
                bd = score_res.breakdown
                scoring_dto = LeadScoringBreakdown(
                    industry_fit=float(bd.get("industry_fit", 20)),
                    company_profile=float(bd.get("company_relevance", 15)),
                    geographic_relevance=float(bd.get("geographic_fit", 15)),
                    product_relevance=float(bd.get("product_fit", 15)),
                    potential_insurance_need=float(bd.get("trigger_strength", 10)),
                    total_fit_score=float(score_res.total),
                    industry_fit_reason=f"Alignment with {brand_clean.title()} underwriting guidelines.",
                    company_profile_reason="Evaluated based on public operational profile and scale.",
                    geographic_relevance_reason=f"Operating in {cand.country or market}.",
                    product_relevance_reason=f"Matched to {brand_cfg.product}.",
                    potential_insurance_need_reason="Evaluated from detected operational expansion triggers.",
                )

                prospect = LeadProspect(
                    name=persisted_lead.name,
                    company=persisted_lead.company,
                    industry=persisted_lead.industry,
                    email=persisted_lead.email,
                    location=persisted_lead.location,
                    company_size=persisted_lead.company_size,
                    recommended_brand=persisted_lead.recommended_brand,
                    fit_score=persisted_lead.fit_score,
                    qualification_reason=persisted_lead.qualification_reason,
                    outreach_draft=persisted_lead.outreach_draft,
                    source=persisted_lead.source,
                    source_type="DEMO_DATA" if persisted_lead.is_demo else "VERIFIED_SOURCE",
                    likely_decision_maker_role=contacts[0].role if contacts else "Executive",
                    insurance_need=brand_cfg.product,
                    risk_exposure=cand.description or "Commercial liability exposure",
                    why_relevant=why_now or cand.description,
                    discovery_rationale=f"Discovered via {cand.source_provider}",
                    domain=persisted_lead.domain,
                    phone=persisted_lead.phone,
                    city=persisted_lead.city,
                    country=persisted_lead.country,
                    why_now=persisted_lead.why_now,
                    score_breakdown_json=persisted_lead.score_breakdown_json,
                    is_demo=persisted_lead.is_demo,
                    scoring_breakdown=scoring_dto,
                )
                results.append(prospect)

            logger.info(f"Pipeline completed: {len(results)} leads discovered & scored for {brand_clean}")
        except Exception as e:
            logger.error(f"Error in discover_and_score_leads pipeline: {e}")
            db.rollback()
        finally:
            db.close()

        return results

    # -------------------------------------------------------------------------
    # 10. Enrich existing lead
    # -------------------------------------------------------------------------
    async def enrich_lead(self, lead_id: int, source_url: Optional[str] = None) -> Lead:
        """Enrich existing lead record with SSRF-safe website inspection, signal detection, and re-scoring."""
        db = SessionLocal()
        try:
            lead = db.get(Lead, lead_id)
            if not lead:
                raise ValueError(f"Lead ID #{lead_id} not found")

            brand_clean = (lead.recommended_brand or "doctorshield").lower()
            target_url = source_url or lead.website or lead.domain

            if target_url:
                inspected_text = self.inspect_website(target_url)
                if inspected_text:
                    lead.description = f"{lead.description or ''} | {inspected_text[:300]}".strip(" | ")
                    lead.source = "VERIFIED_SOURCE"

            # Detect signals from description
            cand = CandidateCompany(
                company_name=lead.company,
                domain=lead.domain,
                country=lead.country or lead.location,
                industry=lead.industry,
                description=lead.description,
                source_provider=lead.source or "verified_registry",
                is_demo=lead.is_demo,
                evidence=[],
            )
            signals = self.detect_signals(cand, brand_clean)
            why_now = self.explain_why_now(lead.company, signals, brand_clean)
            if why_now:
                lead.why_now = why_now

            # Rescore
            score_res = self.score(cand, brand_clean, signals=signals)
            lead.fit_score = float(score_res.total)
            lead.score_breakdown_json = json.dumps(score_res.breakdown)

            # Re-generate outreach
            lead.outreach_draft = self.generate_outreach(
                prospect_name=lead.name,
                company=lead.company,
                brand=brand_clean,
                industry=lead.industry,
                location=lead.location,
                research_context=why_now[:120] if why_now else None,
            )

            db.commit()
            db.refresh(lead)
            return lead
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to enrich lead #{lead_id}: {e}")
            raise e
        finally:
            db.close()

    # -------------------------------------------------------------------------
    # 11. Rescore Lead
    # -------------------------------------------------------------------------
    def score_lead(self, lead_id: int) -> Dict[str, Any]:
        """Recalculate deterministic 5-factor score for an existing lead by ID."""
        db = SessionLocal()
        try:
            lead = db.get(Lead, lead_id)
            if not lead:
                raise ValueError(f"Lead ID #{lead_id} not found")

            brand_clean = (lead.recommended_brand or "doctorshield").lower()
            cand = CandidateCompany(
                company_name=lead.company,
                domain=lead.domain,
                country=lead.country or lead.location,
                industry=lead.industry,
                description=lead.description,
                source_provider=lead.source or "prospecting",
                is_demo=lead.is_demo,
            )
            signals = self.detect_signals(cand, brand_clean)
            why_now = self.explain_why_now(lead.company, signals, brand_clean)
            score_res = self.score(cand, brand_clean, signals=signals)

            lead.fit_score = float(score_res.total)
            lead.score_breakdown_json = json.dumps(score_res.breakdown)
            if why_now:
                lead.why_now = why_now

            db.commit()
            db.refresh(lead)
            return {
                "lead_id": lead.id,
                "score": lead.fit_score,
                "score_breakdown": score_res.breakdown,
                "why_now": lead.why_now,
            }
        finally:
            db.close()


lead_service = LeadService()
