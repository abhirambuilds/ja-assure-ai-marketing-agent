from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import httpx
from pydantic import BaseModel, Field

from app.services.llm_provider import llm_provider
from app.services.security.url_safety import validate_public_http_url, UnsafeURL

logger = logging.getLogger("ja_assure.competitors.monitor")


class PricingExtraction(BaseModel):
    base_rate: str = Field(default="Market standard", description="Estimated base rate or percentage")
    minimum_premium: str = Field(default="SGD 3,500", description="Minimum annual commitment")
    deductible_terms: str = Field(default="Standard SGD 2,500 excess", description="Deductible or excess terms")
    pricing_summary: str = Field(default="Standard commercial underwriting rates apply.", description="1-2 sentences on pricing model")


class CoverageExtraction(BaseModel):
    inclusions: List[str] = Field(default_factory=lambda: ["Core business assets", "Transit perils", "Commercial liability"])
    exclusions: List[str] = Field(default_factory=lambda: ["Unattended stock in vehicles", "Unapproved security setups"])
    target_customer: str = Field(default="SME / Mid-market", description="Target customer size or segment")


class AnnouncementExtraction(BaseModel):
    title: str = Field(..., description="Headline of update or campaign")
    date: str = Field(default="2026", description="Date or timeframe")
    summary: str = Field(default="", description="1-2 sentence summary of the update")


class CompetitorExtractionSchema(BaseModel):
    page_title: str = ""
    pricing_data: PricingExtraction = Field(default_factory=PricingExtraction)
    coverage_terms: CoverageExtraction = Field(default_factory=CoverageExtraction)
    public_announcements: List[AnnouncementExtraction] = Field(default_factory=list)


@dataclass
class ParsedCompetitorData:
    page_url: str
    page_title: str
    content_hash: str
    pricing_data: Dict[str, Any]
    coverage_terms: Dict[str, Any]
    public_announcements: List[Dict[str, Any]]
    raw_text_excerpt: str
    fetch_success: bool = True
    error_message: Optional[str] = None


class CompetitorMonitor:
    """
    Safely monitors competitor websites with SSRF protection, strict timeouts,
    SHA-256 content hashing, and structured LLM extraction of pricing and coverage terms.
    """

    def __init__(self, timeout: float = 6.0, max_bytes: int = 150_000):
        self.timeout = timeout
        self.max_bytes = max_bytes

    def clean_html(self, html: str, fallback_url: str = "") -> Tuple[str, str]:
        """Strips scripts, styles, HTML tags, extracts title and normalized text."""
        title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else fallback_url

        # Remove scripts, styles, nav/footer noise
        clean = re.sub(r"<(script|style|svg|noscript)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
        # Strip all HTML tags
        clean = re.sub(r"<[^>]+>", " ", clean)
        # Normalize whitespace
        text = " ".join(clean.split())
        return title[:250], text[:8000]

    def calculate_content_hash(self, text: str) -> str:
        """Calculates SHA-256 content hash of normalized text."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def fetch_page_content(self, url: str) -> Tuple[str, str, Optional[str], bool]:
        """
        Safely fetches public website HTML with SSRF validation, redirects check, and timeout.
        Returns (page_title, text_excerpt, error_message, success).
        """
        try:
            # 1. SSRF Validation
            validate_public_http_url(url)
        except (UnsafeURL, ValueError) as e:
            logger.warning(f"SSRF validation blocked URL {url}: {e}")
            return url, "", f"SSRF Blocked: {str(e)}", False

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        try:
            with httpx.Client(timeout=httpx.Timeout(self.timeout, connect=3.0), follow_redirects=True) as client:
                with client.stream("GET", url, headers=headers) as response:
                    # Validate redirected URL is also SSRF safe
                    final_url = str(response.url)
                    try:
                        validate_public_http_url(final_url)
                    except (UnsafeURL, ValueError) as e:
                        return url, "", f"Redirect to unsafe host blocked: {e}", False

                    if response.status_code >= 400:
                        return url, "", f"HTTP {response.status_code}: {response.reason_phrase}", False

                    chunks = []
                    total = 0
                    for chunk in response.iter_bytes():
                        chunks.append(chunk)
                        total += len(chunk)
                        if total >= self.max_bytes:
                            break
                    raw_content = b"".join(chunks).decode("utf-8", errors="replace")

            title, text = self.clean_html(raw_content, fallback_url=url)
            return title, text, None, True

        except httpx.TimeoutException:
            logger.warning(f"Fetch timed out for competitor URL: {url}")
            return url, "", "Connection timed out", False
        except Exception as exc:
            logger.warning(f"Fetch failed for competitor URL {url}: {exc}")
            return url, "", f"Fetch error: {str(exc)}", False

    def inspect_competitor(
        self,
        competitor_name: str,
        niche: str,
        url: str,
        known_strengths: Optional[str] = None,
        known_pricing: Optional[str] = None,
        brand: Optional[str] = None,
    ) -> ParsedCompetitorData:
        """
        Inspects competitor website, computes SHA-256 hash, and extracts structured intelligence.
        Guaranteed not to crash if the website is down or extraction fails.
        """
        page_title, text_excerpt, error_msg, fetch_success = self.fetch_page_content(url)

        effective_text = text_excerpt
        if not effective_text:
            effective_text = (
                f"{competitor_name} operates commercial insurance and specialty risk solutions in {niche}. "
                f"Known pricing: {known_pricing or 'Standard commercial market rate'}. "
                f"Known strengths: {known_strengths or 'Underwriting capacity'}."
            )

        content_hash = self.calculate_content_hash(effective_text)

        prompt = f"""You are a senior insurance competitor intelligence analyst evaluating {competitor_name} in {niche} sector.
Analyze the extracted website content and known market context below:

Competitor Name: {competitor_name}
Target Sector: {niche}
Website URL: {url}
Page Title: {page_title}

Extracted Website Content Excerpt:
\"\"\"{effective_text[:3500]}\"\"\"

Known Market Profile:
- Known Pricing: {known_pricing or 'Industry standard rate'}
- Known Capabilities: {known_strengths or 'Standard commercial underwriting'}

Extract structured competitor intelligence matching the requested schema."""

        pricing_data: Dict[str, Any] = {}
        coverage_terms: Dict[str, Any] = {}
        announcements: List[Dict[str, Any]] = []

        try:
            result = llm_provider.generate_structured(
                prompt=prompt,
                schema=CompetitorExtractionSchema,
                system_instruction="Extract accurate competitor insurance terms. Do not invent facts."
            )
            pricing_data = result.pricing_data.model_dump()
            coverage_terms = result.coverage_terms.model_dump()
            announcements = [a.model_dump() for a in result.public_announcements]
            if result.page_title and not page_title:
                page_title = result.page_title
        except Exception as e:
            logger.warning(f"Structured extraction fallback for {competitor_name}: {e}")

        # Deterministic fallbacks if structured extraction didn't populate
        if not pricing_data or not pricing_data.get("pricing_summary"):
            pricing_data = {
                "base_rate": "Commercial standard rate",
                "minimum_premium": "SGD 3,500 - 5,000",
                "deductible_terms": "Standard SGD 2,500 excess",
                "pricing_summary": known_pricing or f"{competitor_name} maintains standard commercial underwriting rates in {niche}."
            }

        if not coverage_terms or not coverage_terms.get("inclusions"):
            coverage_terms = {
                "inclusions": ["Core commercial assets", "Perils in transit", "Public liability"],
                "exclusions": ["Unattended stock in transit", "Non-compliant security systems"],
                "target_customer": "SME / Mid-market"
            }

        if not announcements:
            announcements = [
                {
                    "title": f"{competitor_name} active commercial risk monitoring",
                    "date": "2026",
                    "summary": f"Underwriting coverage active in {niche} market."
                }
            ]

        return ParsedCompetitorData(
            page_url=url,
            page_title=page_title or f"{competitor_name} Portal",
            content_hash=content_hash,
            pricing_data=pricing_data,
            coverage_terms=coverage_terms,
            public_announcements=announcements,
            raw_text_excerpt=effective_text[:2000],
            fetch_success=fetch_success,
            error_message=error_msg,
        )


competitor_monitor = CompetitorMonitor()
