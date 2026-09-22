from __future__ import annotations

import logging
from collections import OrderedDict
from typing import List, Tuple

from app.services.discovery.base import CandidateCompany
from app.services.enrichment.normalization import (
    normalize_company_name,
    normalize_domain,
    normalize_phone,
)

logger = logging.getLogger("ja_assure.deduplication")


class DeduplicationService:
    """Multi-stage deduplication service adhering to the 4-stage hierarchy:

    1. Domain (normalized root domain)
    2. Source Provider & Identifier (e.g. Google Places ID or Registry ID)
    3. Phone (normalized digit string)
    4. Normalized Company Name (punctuation/entity suffix stripped)
    """

    def key_for(self, candidate: CandidateCompany) -> Tuple[str, str]:
        norm_domain = normalize_domain(candidate.domain)
        if norm_domain:
            return ("domain", norm_domain)
        if candidate.source_identifier and candidate.source_provider:
            return (candidate.source_provider, candidate.source_identifier)
        norm_ph = normalize_phone(candidate.phone)
        if norm_ph and len(norm_ph) >= 7:
            # Match on significant subscriber digits (last 8) across international and local representations
            ph_key = norm_ph[-8:] if len(norm_ph) >= 8 else norm_ph
            return ("phone", ph_key)
        norm_name = normalize_company_name(candidate.company_name)
        return ("name", norm_name)

    def deduplicate(self, candidates: List[CandidateCompany]) -> List[CandidateCompany]:
        merged: OrderedDict[Tuple[str, str], CandidateCompany] = OrderedDict()

        for candidate in candidates:
            # Clean and normalize domain, phone, company name
            candidate.domain = normalize_domain(candidate.domain)
            candidate.phone = normalize_phone(candidate.phone)

            key = self.key_for(candidate)
            if key in merged:
                existing = merged[key]
                # Merge evidence lists
                existing.evidence.extend(candidate.evidence)
                # Enrich fields if current candidate has more information
                if not existing.description and candidate.description:
                    existing.description = candidate.description
                if not existing.address and candidate.address:
                    existing.address = candidate.address
                if not existing.phone and candidate.phone:
                    existing.phone = candidate.phone
                if not existing.domain and candidate.domain:
                    existing.domain = candidate.domain
                logger.debug(f"Deduplicated duplicate candidate using key {key}")
            else:
                merged[key] = candidate

        return list(merged.values())
