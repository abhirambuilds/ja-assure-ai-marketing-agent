from __future__ import annotations

from typing import List
from app.services.discovery.base import CandidateCompany
from app.services.discovery.config import BrandConfig


class CompanyVerifier:
    """Verifies that discovered leads match target brand verticals and geographic markets."""

    def __init__(self, brand_config: BrandConfig):
        self.brand_config = brand_config

    def is_relevant(self, candidate: CandidateCompany, market: str) -> bool:
        industry = (candidate.industry or "").lower()
        text = " ".join([candidate.company_name, candidate.description or "", industry]).lower()
        
        # Check market alignment
        market_ok = (
            not candidate.country
            or candidate.country.lower() == market.lower()
            or market.lower() in text
        )

        # High confidence for direct targeted discovery sources with evidence
        if candidate.source_provider in ("google_places", "market_intel") and candidate.evidence:
            return market_ok and bool(candidate.company_name)

        keywords: List[str] = list(self.brand_config.industries)
        if any("transit" in ind or "logistics" in ind or "freight" in ind for ind in self.brand_config.industries):
            keywords.extend(["transport", "shipping", "cargo", "warehouse", "forwarder", "forwarding", "courier", "freight", "fleet", "supply chain"])
        elif any("jewel" in ind for ind in self.brand_config.industries):
            keywords.extend(["diamond", "gem", "gemstone", "gold", "watch", "horology", "retailer", "boutique", "atelier"])
        elif any("clinic" in ind or "doctor" in ind for ind in self.brand_config.industries):
            keywords.extend(["medical", "healthcare", "surgery", "hospital", "specialist", "health", "physician", "dental", "aesthetic", "dermatology"])

        industry_ok = any(term.replace("_", " ") in text or term in industry for term in keywords)
        plausible = bool(candidate.company_name and (candidate.domain or candidate.evidence))
        return market_ok and industry_ok and plausible
