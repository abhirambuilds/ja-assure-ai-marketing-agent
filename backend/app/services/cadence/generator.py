from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger("app.cadence.generator")

FORBIDDEN_PHRASES: List[str] = [
    "definitely needs",
    "guaranteed",
    "your current insurer",
    "we spoke",
    "i noticed you personally",
]

PRODUCT_BY_BRAND: Dict[str, str] = {
    "jade": "Jade jewellery and jewellers block insurance",
    "doctorshield": "DoctorShield medical indemnity insurance",
    "jaguartransit": "Jaguar Transit high-value cargo and transit coverage",
}


@dataclass(frozen=True)
class CadenceTouch:
    step: int
    day: str
    label: str
    subject: str
    body: str


@dataclass
class GeneratedCadence:
    subject: str
    body: str
    touches: List[CadenceTouch]
    personalization_points: List[str] = field(default_factory=list)
    evidence_used: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subject": self.subject,
            "body": self.body,
            "touches": [
                {
                    "step": t.step,
                    "day": t.day,
                    "label": t.label,
                    "subject": t.subject,
                    "body": t.body,
                }
                for t in self.touches
            ],
            "personalization_points": self.personalization_points,
            "evidence_used": self.evidence_used,
        }


class CadenceGenerator:
    """Generates an evidence-backed, 3-touch outreach sequence with brand context

    and strict regulatory compliance checks.
    """

    def __init__(self, brand: str = "jade"):
        self.brand = (brand or "jade").lower().strip()
        self.product = PRODUCT_BY_BRAND.get(self.brand, "Specialty Commercial Insurance Solutions")

    def validate_safety(self, text: str) -> None:
        """Verify that generated text does not contain deceptive or non-compliant phrases."""
        lowered = text.lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase.lower() in lowered:
                raise ValueError(f"Unsafe outreach phrase detected in outreach text: '{phrase}'")

    def generate(
        self,
        *,
        company_name: str,
        contact_name: Optional[str] = None,
        contact_role: Optional[str] = None,
        market: str = "Singapore",
        signals: Optional[List[str]] = None,
        why_now: Optional[str] = None,
        fit_score: float = 75.0,
    ) -> GeneratedCadence:
        signals = signals or []
        evidence_line = ""
        evidence_used = []

        if signals:
            evidence_line = f"I noticed that {company_name} recently recorded public business activity: {signals[0]}"
            evidence_used = signals[:2]
        elif why_now and why_now.strip():
            evidence_line = why_now.strip()
            evidence_used = [why_now.strip()]
        else:
            evidence_line = f"Given {company_name}'s commercial operations in the {market} market, we are reaching out with relevant risk underwriting context."

        contact_greeting = f" {contact_name}" if contact_name and contact_name.strip() and contact_name.lower() != "decision maker" else ""
        role_clause = f" for your {contact_role} team" if contact_role and contact_role.strip() else ""

        # Touch 1: Step 1 (Day 0) — Initial Intro & Niche Hook
        touch_1_subject = f"{self.brand.upper()}: Relevant underwriting context for {company_name}"
        touch_1_body = (
            f"Hello{contact_greeting},\n\n"
            f"{evidence_line}\n\n"
            f"JA Assure works with {market} businesses through {self.product}. "
            f"Given the above, {company_name} may be a relevant prospect fit{role_clause}. "
            "This is not an assumption that you need insurance; it is a prompt for an exploratory business conversation.\n\n"
            "Would it be useful to share a short overview for the appropriate person?\n\n"
            "Best regards,\nJA Assure Underwriting Advisory\n\n"
            "If this is not relevant, please reply and we will immediately update our contact preferences."
        )
        self.validate_safety(touch_1_body)

        # Touch 2: Step 2 (Day 4) — Competitive Advantage & Warranty Comparison
        touch_2_subject = f"Follow-up: {self.brand.upper()} Lloyd's underwriting agility for {company_name}"
        touch_2_body = (
            f"Hello{contact_greeting},\n\n"
            f"Following up on my previous note regarding {company_name}.\n\n"
            f"Unlike traditional regional underwriters who require weeks of paperwork and cumbersome on-site audit restrictions, "
            f"JA Assure provides Lloyd's of London coverholder terms with digital quote-to-bind speed and streamlined underwriting warranties.\n\n"
            f"For {company_name}'s operations in {market}, this delivers instant balance-sheet security with minimal administrative friction.\n\n"
            f"Would 10 minutes next Tuesday or Wednesday work for a brief introductory overview?\n\n"
            f"Best regards,\nJA Assure Underwriting Advisory"
        )
        self.validate_safety(touch_2_body)

        # Touch 3: Step 3 (Day 9) — Executive Consultation & Wrap-up
        touch_3_subject = f"Final note regarding {self.product} for {company_name}"
        touch_3_body = (
            f"Hello{contact_greeting},\n\n"
            f"I know you have a demanding schedule managing commercial operations at {company_name}.\n\n"
            f"If reviewing specialized {self.product} terms isn't a priority right now, I completely understand. "
            f"Should your risk management or policy renewal considerations change later this year, our Lloyd's coverholder team remains at your disposal.\n\n"
            f"Wishing {company_name} continued commercial success.\n\n"
            f"Best regards,\nJA Assure Underwriting Advisory"
        )
        self.validate_safety(touch_3_body)

        touches = [
            CadenceTouch(
                step=1,
                day="Day 0",
                label="Initial Intro & Niche Hook",
                subject=touch_1_subject,
                body=touch_1_body,
            ),
            CadenceTouch(
                step=2,
                day="Day 4",
                label="Competitive Advantage & Warranty Comparison",
                subject=touch_2_subject,
                body=touch_2_body,
            ),
            CadenceTouch(
                step=3,
                day="Day 9",
                label="Executive Consultation & Wrap-up",
                subject=touch_3_subject,
                body=touch_3_body,
            ),
        ]

        personalization_points = [
            f"Brand: {self.brand.upper()} ({self.product})",
            f"Fit Score: {fit_score:.1f}",
            f"Market: {market}",
        ]
        if why_now:
            personalization_points.append(f"Why Now: {why_now}")

        return GeneratedCadence(
            subject=touch_1_subject,
            body=touch_1_body,
            touches=touches,
            personalization_points=personalization_points,
            evidence_used=evidence_used,
        )
