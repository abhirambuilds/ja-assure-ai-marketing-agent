from __future__ import annotations

import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.discovery.base import (
    CandidateCompany,
    DiscoveryProvider,
    DiscoveryRequest,
    RateLimiter,
    SourceEvidence,
)
from app.services.discovery.config import get_brand_config
from app.services.llm_provider import llm_provider

logger = logging.getLogger("ja_assure.discovery.market_intel")


class DiscoveredMarketCompany(BaseModel):
    company_name: str
    domain: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    industry_category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    description: str
    recent_development: Optional[str] = None


class DiscoveredMarketCompanyList(BaseModel):
    companies: List[DiscoveredMarketCompany] = Field(default_factory=list)


class MarketIntelDiscoveryProvider(DiscoveryProvider):
    """Commercial B2B market intelligence provider using LLM knowledge base."""

    name = "market_intel"

    def __init__(self):
        self.rate_limiter = RateLimiter(0.3)

    def discover(self, request: DiscoveryRequest) -> List[CandidateCompany]:
        if not llm_provider.is_live:
            logger.info("LLM provider is offline / mock mode; skipping live market intel discovery.")
            return []

        self.rate_limiter.wait()
        brand_cfg = get_brand_config(request.brand)
        market = request.market or "Singapore"
        target_ind = request.target_industry or (brand_cfg.industries[0] if brand_cfg.industries else "commercial")

        prompt = f"""You are a commercial B2B research intelligence assistant for {brand_cfg.product}.
Provide a list of 5 real, active, genuine businesses operating in {market} in the {target_ind} industry.
Include a balanced mix of prominent established leaders, specialized boutiques/clinics/operators, and wholesale or enterprise firms.

CRITICAL RULES:
1. Return ONLY real companies operating in {market}.
2. Provide legitimate domains/websites where known, or null.
3. In recent_development, include any known recent branch openings, showroom launches, certifications, fleet additions, or notable milestones.

Return a JSON object conforming to the schema with key 'companies' containing an array of company items."""

        candidates: List[CandidateCompany] = []
        try:
            structured: DiscoveredMarketCompanyList = llm_provider.generate_structured(
                prompt=prompt,
                schema=DiscoveredMarketCompanyList,
                system_instruction=f"Commercial intelligence researcher for {brand_cfg.product}. Output strictly valid JSON."
            )
            if structured and hasattr(structured, "companies") and isinstance(structured.companies, list):
                items = [c for c in structured.companies if isinstance(c, DiscoveredMarketCompany)]
            else:
                items = []
        except Exception as e:
            logger.warning(f"Structured market intel discovery failed: {e}. Attempting text fallback parse.")
            items = []
            try:
                raw_text = llm_provider.generate_text(prompt)
                cleaned = raw_text.strip()
                start_idx = cleaned.find("[")
                end_idx = cleaned.rfind("]")
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    parsed_array = json.loads(cleaned[start_idx : end_idx + 1])
                    items = [DiscoveredMarketCompany(**item) for item in parsed_array if isinstance(item, dict)]
            except Exception as parse_err:
                logger.warning(f"Fallback parse failed: {parse_err}")
                items = []

        for item in items:
            if not isinstance(item, DiscoveredMarketCompany):
                continue
            desc = item.description or f"{item.company_name} is an active {target_ind} business in {market}."
            evidence_parts = [desc]
            if item.recent_development:
                evidence_parts.append(f"Recent milestone: {item.recent_development}")
            evidence_text = " | ".join(evidence_parts)

            candidates.append(
                CandidateCompany(
                    company_name=item.company_name,
                    domain=item.domain,
                    country=item.country or market,
                    city=item.city or market,
                    address=item.address,
                    phone=item.phone,
                    industry=item.industry_category or target_ind,
                    description=desc,
                    source_provider=self.name,
                    source_identifier=item.domain or item.company_name.lower().replace(" ", "-"),
                    is_demo=False,
                    evidence=[
                        SourceEvidence(
                            source_type="market_intelligence",
                            source_url=f"https://{item.domain}" if item.domain else "https://example.com/market-intel",
                            title=f"Market Intelligence: {item.company_name}",
                            evidence_excerpt=evidence_text,
                            provider=self.name,
                            confidence=0.85,
                        )
                    ],
                )
            )

        return candidates
