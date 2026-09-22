from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ReplyIntent(str, Enum):
    UNSUBSCRIBE = "unsubscribe"
    BOUNCE = "bounce"
    NEGATIVE = "negative"
    OUT_OF_OFFICE = "out_of_office"
    MEETING_REQUEST = "meeting_request"
    REQUEST_FOR_INFORMATION = "request_for_information"
    POSITIVE = "positive"
    UNKNOWN = "unknown"


UNSUBSCRIBE_PHRASES = [
    "unsubscribe",
    "remove me",
    "stop contacting me",
    "do not contact me",
    "not interested, stop",
    "opt out",
    "take me off",
    "leave me alone",
]

BOUNCE_PHRASES = [
    "undeliverable",
    "delivery failed",
    "mailbox unavailable",
    "bounced",
    "user unknown",
    "host not found",
    "mail delivery subsystem",
]

NEGATIVE_PHRASES = [
    "not interested",
    "uninterested",
    "no thanks",
    "not for us",
    "not looking",
    "do not need",
    "don't need",
    "no need",
    "pass on this",
    "stop emailing",
]

OUT_OF_OFFICE_PHRASES = [
    "out of office",
    "on annual leave",
    "maternity leave",
    "paternity leave",
    "away from the office",
    "auto-reply",
    "automated response",
]


@dataclass(frozen=True)
class ReplyClassification:
    intent: ReplyIntent
    confidence: float
    suggested_action: str
    deterministic: bool = True


class ReplyClassifier:
    """Classifies inbound prospect replies into deterministic business intents

    using prioritized compliance-first matching rules.
    """

    def classify(self, message: Optional[str]) -> ReplyClassification:
        if not message:
            return ReplyClassification(ReplyIntent.UNKNOWN, 0.0, "Empty message received.")

        text = message.strip().lower()

        # 1. Unsubscribe / Opt-Out (Highest priority for legal and regulatory compliance)
        if any(phrase in text for phrase in UNSUBSCRIBE_PHRASES):
            return ReplyClassification(
                ReplyIntent.UNSUBSCRIBE,
                0.99,
                "Immediately add to suppression list and prevent further automated outreach.",
            )

        # 2. Bounce / Undeliverable
        if any(phrase in text for phrase in BOUNCE_PHRASES):
            return ReplyClassification(
                ReplyIntent.BOUNCE,
                0.98,
                "Mark lead email as bounced and suppress invalid mailbox address.",
            )

        # 3. Explicit Negative Intent (Must be evaluated BEFORE positive keywords)
        if any(phrase in text for phrase in NEGATIVE_PHRASES):
            return ReplyClassification(
                ReplyIntent.NEGATIVE,
                0.85,
                "Prospect declined. Mark not interested and pause active sequences.",
            )

        # 4. Out of Office
        if any(phrase in text for phrase in OUT_OF_OFFICE_PHRASES) or re.search(r"\baway\b", text):
            return ReplyClassification(
                ReplyIntent.OUT_OF_OFFICE,
                0.85,
                "Prospect is away. Reschedule follow-up for next business week.",
            )

        # 5. Meeting Request
        if re.search(r"\b(schedule|meeting|call|calendly|zoom)\b", text):
            return ReplyClassification(
                ReplyIntent.MEETING_REQUEST,
                0.85,
                "High-priority lead intent: Alert underwriting representative to schedule meeting.",
            )

        # 6. Request for Information
        if re.search(r"\b(more info|more information|details|pricing|brochure|deck|overview)\b", text) or "send more" in text:
            return ReplyClassification(
                ReplyIntent.REQUEST_FOR_INFORMATION,
                0.80,
                "Prepare Lloyd's coverholder policy spec sheet and collateral for human review.",
            )

        # 7. Positive Intent (Evaluated with strict word boundaries)
        if re.search(r"\b(yes|interested|sounds good|let's talk|sure)\b", text):
            return ReplyClassification(
                ReplyIntent.POSITIVE,
                0.75,
                "Positive engagement. Follow up promptly with tailored introduction.",
            )

        return ReplyClassification(
            ReplyIntent.UNKNOWN,
            0.40,
            "Ambiguous reply. Route to human reviewer for evaluation.",
        )
