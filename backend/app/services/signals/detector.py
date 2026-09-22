from __future__ import annotations

import logging
from typing import Dict, List, Optional

from app.services.discovery.base import CandidateCompany, Signal
from app.services.signals.classifier import SignalClassifier

logger = logging.getLogger("ja_assure.signals.detector")


class SignalDetector:
    """Detects evidence-backed signals and crafts compliant 'Why Now' opportunity explanations."""

    def __init__(self, classifier: SignalClassifier):
        self.classifier = classifier

    def detect(self, candidate: CandidateCompany) -> List[Signal]:
        best_by_type: Dict[str, Signal] = {}
        for evidence in candidate.evidence:
            if not evidence.source_url:
                continue
            for signal_type, keyword_confidence in self.classifier.classify_all(evidence.evidence_excerpt):
                confidence = round(min(keyword_confidence, evidence.confidence), 3)
                existing = best_by_type.get(signal_type)
                if existing is None or confidence > existing.confidence:
                    best_by_type[signal_type] = Signal(
                        signal_type=signal_type,
                        description=evidence.evidence_excerpt,
                        source_url=evidence.source_url,
                        source_type=evidence.source_type,
                        confidence=confidence,
                    )
        return sorted(best_by_type.values(), key=lambda s: -s.confidence)

    def why_now(self, company_name: str, signals: List[Signal], brand: str) -> Optional[str]:
        """Compose a cautious, evidence-backed 'Why Now' statement.

        Compliant with InsurTech rules:
        - Never fabricates need or assumes deficiency.
        - Mentions observed public event and links to underwriting relevance.
        """
        strong = [signal for signal in signals if signal.confidence >= 0.5]
        if not strong:
            return None
        strong.sort(key=lambda s: -s.confidence)
        primary = strong[0]
        readable = primary.signal_type.replace("_", " ")

        statement = (
            f"{company_name} demonstrates an observed business expansion trigger ({readable}): "
            f"\"{primary.description.strip()}\". "
        )
        if len(strong) > 1:
            others = ", ".join(sorted({s.signal_type.replace("_", " ") for s in strong[1:]}))
            statement += f"Additional corroborating triggers detected: {others}. "

        statement += (
            f"This commercial growth milestone may create a timely opportunity to introduce {brand.title()}'s specialized underwriting facility. "
            "Attribution is grounded in cited public registry/search evidence."
        )
        return statement
