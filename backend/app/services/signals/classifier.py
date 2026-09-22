from __future__ import annotations

from typing import Dict, List, Tuple
from app.services.discovery.config import BrandConfig

SIGNAL_KEYWORDS: Dict[str, Dict[str, List[str]]] = {
    # Jade / Jewellery Signals
    "new_showroom": {"strong": ["new showroom", "opened a showroom", "flagship showroom"], "weak": ["showroom"]},
    "new_location": {"strong": ["new retail location", "new location", "new outlet", "opening a new"], "weak": ["opened", "opening"]},
    "expansion": {"strong": ["expanding operations", "major expansion", "significant expansion"], "weak": ["expansion", "expanded", "growing", "growth"]},
    "new_branch": {"strong": ["new branch", "opened a branch"], "weak": ["branch"]},
    "acquisition": {"strong": ["acquired", "acquisition of", "has acquired"], "weak": ["acquisition", "merger"]},
    "partnership": {"strong": ["announced a partnership", "strategic partnership", "partnered with"], "weak": ["partnership", "collaboration"]},
    "international_expansion": {"strong": ["international expansion", "expanding overseas", "entering the market"], "weak": ["overseas", "global expansion"]},
    "warehouse_expansion": {"strong": ["new warehouse", "new distribution centre", "new distribution center", "vault capacity"], "weak": ["warehouse", "vault"]},
    "trade_event": {"strong": ["trade exhibition", "trade show", "exhibiting at"], "weak": ["exhibition", "fair", "expo"]},
    "business_launch": {"strong": ["launched a new", "officially launched", "product launch"], "weak": ["launched", "launch"]},
    "hiring_activity": {"strong": ["expanding the team", "significant hiring", "scaling the team"], "weak": ["hiring", "recruiting", "now hiring"]},
    # Jaguar Transit / Logistics Signals
    "new_logistics_route": {"strong": ["new logistics route", "new shipping route", "new trade lane"], "weak": ["new route"]},
    "fleet_expansion": {"strong": ["fleet expansion", "expanding its fleet", "new fleet", "expanding secure fleet"], "weak": ["fleet", "new vehicles"]},
    "cross_border_expansion": {"strong": ["cross-border expansion", "cross border operations"], "weak": ["cross-border", "cross border"]},
    "distribution_center": {"strong": ["new distribution center", "new distribution centre", "new hub", "distribution center expansion"], "weak": ["distribution center", "distribution centre"]},
    "logistics_partnership": {"strong": ["logistics partnership", "3pl partnership"], "weak": ["logistics partner"]},
    # DoctorShield / Healthcare Signals
    "new_clinic": {"strong": ["new clinic", "opened a clinic", "opening a clinic"], "weak": ["clinic launch"]},
    "new_medical_center": {"strong": ["new medical center", "new medical centre", "new medical facility"], "weak": ["medical center", "medical centre"]},
    "new_specialist": {"strong": ["new specialist", "welcomed a specialist", "new consultant"], "weak": ["specialist joins"]},
    "new_practice": {"strong": ["new practice", "opened a practice", "started a practice"], "weak": ["private practice"]},
    "healthcare_expansion": {"strong": ["healthcare expansion", "expanding services", "new department"], "weak": ["expansion of services"]},
}

STRONG_CONFIDENCE = 0.85
WEAK_CONFIDENCE = 0.55


class SignalClassifier:
    """Classifies business events and expansion signals with evidence-graded confidence."""

    def __init__(self, brand_config: BrandConfig):
        self.brand_config = brand_config

    def classify(self, text: str) -> Tuple[str | None, float]:
        results = self.classify_all(text)
        return results[0] if results else (None, 0.0)

    def classify_all(self, text: str) -> List[Tuple[str, float]]:
        lowered = text.lower()
        matches: List[Tuple[str, float]] = []
        for signal_type, tiers in SIGNAL_KEYWORDS.items():
            if signal_type not in self.brand_config.signal_types:
                continue
            if any(kw in lowered for kw in tiers.get("strong", [])):
                matches.append((signal_type, STRONG_CONFIDENCE))
            elif any(kw in lowered for kw in tiers.get("weak", [])):
                matches.append((signal_type, WEAK_CONFIDENCE))
        # Sort highest confidence first, then alphabetical tie-breaker
        matches.sort(key=lambda m: (-m[1], m[0]))
        return matches
