from __future__ import annotations

from typing import Dict, List, Optional
from app.services.discovery.base import Contact, ScoreResult, Signal
from app.services.discovery.config import BrandConfig


class LeadScorer:
    """Deterministic 5-factor scoring engine (0-100) with explainable component breakdowns."""

    def __init__(self, brand_config: BrandConfig):
        self.brand_config = brand_config

    def score(
        self,
        *,
        industry: Optional[str],
        country: Optional[str],
        market: str,
        product_fit: Optional[str] = None,
        signals: Optional[List[Signal]] = None,
        contacts: Optional[List[Contact]] = None,
        has_description: bool = True,
    ) -> ScoreResult:
        weights = self.brand_config.scoring_weights
        signals = signals or []
        contacts = contacts or []

        # 1. Industry Fit (max 25)
        industry_clean = (industry or "").lower()
        if any(ind in industry_clean for ind in self.brand_config.industries):
            industry_fit = weights.get("industry_fit", 25)
        elif industry_clean:
            industry_fit = round(weights.get("industry_fit", 25) * 0.6)
        else:
            industry_fit = 0

        # 2. Company Relevance / Profile (max 20)
        relevance_weight = weights.get("company_relevance", 20)
        company_relevance = relevance_weight if has_description else round(relevance_weight * 0.5)

        # 3. Geographic Fit (max 20)
        geo_weight = weights.get("geographic_fit", 20)
        country_clean = (country or "").lower()
        market_clean = market.lower()
        if country_clean == market_clean or market_clean in country_clean:
            geographic_fit = geo_weight
        elif any(m.lower() in country_clean for m in self.brand_config.markets):
            geographic_fit = round(geo_weight * 0.85)
        else:
            geographic_fit = round(geo_weight * 0.4)

        # 4. Product Fit (max 20)
        prod_weight = weights.get("product_fit", 20)
        if product_fit:
            product_score = prod_weight
        elif industry_clean and any(ind in industry_clean for ind in self.brand_config.industries):
            product_score = round(prod_weight * 0.9)
        else:
            product_score = round(prod_weight * 0.5)

        # 5. Trigger Strength / Expansion Signals (max 15)
        trigger_weight = weights.get("trigger_strength", 15)
        if signals:
            max_conf = max(signal.confidence for signal in signals)
            trigger_score = round(trigger_weight * max_conf)
        else:
            trigger_score = round(trigger_weight * 0.3)

        breakdown: Dict[str, int] = {
            "industry_fit": industry_fit,
            "company_relevance": company_relevance,
            "geographic_fit": geographic_fit,
            "product_fit": product_score,
            "trigger_strength": trigger_score,
        }

        total = max(0, min(100, sum(breakdown.values())))
        return ScoreResult(total=total, breakdown=breakdown)
