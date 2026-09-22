from __future__ import annotations

import logging
from typing import List, Optional, Set
import httpx

from app.config import settings
from app.services.discovery.base import (
    CandidateCompany,
    DiscoveryProvider,
    DiscoveryRequest,
    RateLimiter,
    SourceEvidence,
)
from app.services.discovery.config import get_brand_config

logger = logging.getLogger("ja_assure.discovery.google_places")


class GooglePlacesProvider(DiscoveryProvider):
    """Google Places API (New) discovery provider with query expansion and rate limiting."""

    name = "google_places"

    def __init__(self, client: Optional[httpx.Client] = None):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.client = client or httpx.Client(timeout=12.0, follow_redirects=False)
        self.rate_limiter = RateLimiter(0.2)

    def _get_search_queries(self, request: DiscoveryRequest) -> List[str]:
        brand_cfg = get_brand_config(request.brand)
        market = request.market or "Singapore"
        queries: List[str] = []

        for template in brand_cfg.discovery_queries:
            queries.append(template.format(market=market))

        if request.target_industry:
            queries.insert(0, f"{request.target_industry} in {market}")
        if request.keywords:
            queries.insert(0, f"{request.keywords} in {market}")

        return queries[:5]

    def discover(self, request: DiscoveryRequest) -> List[CandidateCompany]:
        if not self.api_key:
            logger.info("Google Maps API key not configured; skipping Google Places discovery.")
            return []

        queries = self._get_search_queries(request)
        field_mask = (
            "places.id,places.displayName,places.formattedAddress,"
            "places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,"
            "places.rating,places.userRatingCount,places.editorialSummary,"
            "places.types,places.businessStatus"
        )
        url = "https://places.googleapis.com/v1/places:searchText"
        headers = {
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": field_mask,
        }

        seen_place_ids: Set[str] = set()
        candidates: List[CandidateCompany] = []

        for query in queries:
            if len(candidates) >= request.target_count:
                break

            self.rate_limiter.wait()
            try:
                response = self.client.post(
                    url,
                    headers=headers,
                    json={"textQuery": query, "pageSize": min(20, request.target_count)},
                )
                response.raise_for_status()
                places = response.json().get("places", [])
            except Exception as e:
                logger.warning(f"Google Places search failed for query '{query}': {e}")
                continue

            for place in places:
                place_id = place.get("id")
                if not place_id or place_id in seen_place_ids:
                    continue
                seen_place_ids.add(place_id)

                name = place.get("displayName", {}).get("text", "Unknown Business")
                website = place.get("websiteUri")
                domain = (
                    website.replace("https://", "").replace("http://", "").split("/")[0]
                    if website
                    else None
                )
                address = place.get("formattedAddress")
                phone = place.get("nationalPhoneNumber")
                maps_url = place.get("googleMapsUri") or f"https://maps.google.com/?q={place_id}"
                rating = place.get("rating")
                user_ratings_total = place.get("userRatingCount")
                summary_obj = place.get("editorialSummary")
                summary_text = summary_obj.get("text") if summary_obj else None
                types = [
                    t.replace("_", " ")
                    for t in place.get("types", [])
                    if t not in {"point_of_interest", "establishment"}
                ]

                # Build rich description
                if summary_text:
                    desc = summary_text
                elif rating and user_ratings_total:
                    types_str = f" ({', '.join(types[:2])})" if types else ""
                    desc = (
                        f"{name} is a {request.target_industry or 'commercial'} business in {request.market}{types_str}. "
                        f"Rated {rating}★ across {user_ratings_total} Google Maps reviews."
                    )
                else:
                    types_str = f" ({', '.join(types[:2])})" if types else ""
                    desc = f"{name} is an active business operating in {request.market}{types_str}."

                rating_str = f" Rated {rating}★ with {user_ratings_total} reviews." if rating else ""
                evidence_text = f"Google Places listing: {name} located at {address or request.market}.{rating_str}"

                candidates.append(
                    CandidateCompany(
                        company_name=name,
                        domain=domain,
                        country=request.market,
                        address=address,
                        phone=phone,
                        industry=request.target_industry or "commercial",
                        description=desc,
                        source_provider=self.name,
                        source_identifier=place_id,
                        evidence=[
                            SourceEvidence(
                                source_type="google_places_api",
                                source_url=maps_url,
                                title=f"Google Places: {name}",
                                evidence_excerpt=evidence_text,
                                provider=self.name,
                                confidence=0.88,
                            )
                        ],
                    )
                )

        return candidates
