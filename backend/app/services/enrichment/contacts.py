from __future__ import annotations

import logging
from typing import List, Optional
import httpx

from app.config import settings
from app.services.discovery.base import (
    CandidateCompany,
    Contact,
    RateLimiter,
)

logger = logging.getLogger("ja_assure.enrichment.contacts")


class DemoContactProvider:
    name = "demo_contact_provider"

    def find_contacts(self, candidate: CandidateCompany, roles: List[str]) -> List[Contact]:
        if not candidate.is_demo or not candidate.domain:
            return []
        primary_role = roles[0] if roles else "Principal Executive"
        return [
            Contact(
                name="DEMO DATA - Business Executive",
                role=primary_role,
                email=f"contact@{candidate.domain}",
                email_status="verified",
                source_url="https://example.com/demo-contact-source",
                confidence=0.85,
            )
        ]


class HunterContactProvider:
    """Hunter.io API adapter for verified professional B2B contact discovery.

    Strict rules:
    - Never fabricates contact information.
    - If API key is not configured, returns empty list gracefully.
    - If quota is exhausted or rate limit hit, gracefully degrades.
    """

    name = "hunter"

    def __init__(self, client: Optional[httpx.Client] = None):
        self.api_key = settings.HUNTER_API_KEY
        self.client = client or httpx.Client(timeout=8.0, follow_redirects=False)
        self.rate_limiter = RateLimiter(min_interval_seconds=0.3)
        self._quota_exhausted = False

    def find_contacts(self, candidate: CandidateCompany, roles: List[str]) -> List[Contact]:
        if not self.api_key or not candidate.domain or self._quota_exhausted:
            return []

        self.rate_limiter.wait()
        url = "https://api.hunter.io/v2/domain-search"
        headers = {"X-API-KEY": self.api_key}
        params = {
            "domain": candidate.domain,
            "limit": 5,
        }

        try:
            response = self.client.get(url, headers=headers, params=params)
            if response.status_code in {401, 403}:
                params["api_key"] = self.api_key
                response = self.client.get(url, params=params)
            if response.status_code == 429:
                logger.warning("Hunter.io rate limit reached; suspending further calls.")
                self._quota_exhausted = True
                return []
            response.raise_for_status()
        except Exception as exc:
            logger.warning(f"Hunter.io lookup failed for domain '{candidate.domain}': {exc}")
            return []

        data = response.json().get("data", {})
        raw_emails = data.get("emails", [])
        contacts: List[Contact] = []

        for entry in raw_emails:
            first = entry.get("first_name") or ""
            last = entry.get("last_name") or ""
            full_name = f"{first} {last}".strip() or None
            position = entry.get("position")
            email_val = entry.get("value")
            confidence = float(entry.get("confidence", 0)) / 100.0

            verification = entry.get("verification", {})
            status_str = verification.get("status")
            if status_str == "valid" and confidence >= 0.7:
                email_status = "verified"
            elif status_str == "invalid":
                email_status = "invalid"
            else:
                email_status = "unverified"

            assigned_role = position or (roles[0] if roles else "Executive")

            contacts.append(
                Contact(
                    name=full_name,
                    role=assigned_role,
                    email=email_val,
                    email_status=email_status,
                    source_url=f"https://hunter.io/search/{candidate.domain}",
                    confidence=confidence,
                )
            )

        return contacts
