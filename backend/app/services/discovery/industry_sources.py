from __future__ import annotations

import logging
from typing import List
from app.services.discovery.base import (
    CandidateCompany,
    DiscoveryProvider,
    DiscoveryRequest,
    SourceEvidence,
)
from app.services.discovery.config import get_brand_config

logger = logging.getLogger("ja_assure.discovery.industry_sources")


def get_demo_candidates(brand: str = "jade", market: str = "Singapore") -> List[CandidateCompany]:
    """Curated deterministic synthetic candidates for offline demo and verification tests."""
    brand_lower = (brand or "jade").lower()

    if "jade" in brand_lower:
        return [
            CandidateCompany(
                company_name="DEMO DATA - Sovereign Gemological Ateliers",
                domain="sovereign-gems-demo.sg",
                country=market,
                city=market,
                address="DEMO DATA - 290 Orchard Road, Paragon #03-12, Singapore 238859",
                phone="+65 6738 0001",
                industry="jewellery_retail",
                description="DEMO DATA - High-end bespoke diamond and sapphire salon servicing Southeast Asian ultra-high-net-worth collectors.",
                source_provider="industry_registry",
                source_identifier="sja-reg-001",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/sja-directory/sovereign-gems",
                        title="Singapore Jewellers Association Member Directory",
                        evidence_excerpt="DEMO DATA: Active SJA member. Announced a new flagship showroom opening in Marina Bay Sands.",
                        provider="sja_registry",
                        confidence=0.92,
                    )
                ],
            ),
            CandidateCompany(
                company_name="DEMO DATA - Orient Gold & Diamond Merchants",
                domain="orient-gold-demo.com.sg",
                country=market,
                city=market,
                address="DEMO DATA - 101 South Bridge Road, Chinatown, Singapore 058730",
                phone="+65 6533 0002",
                industry="jewellery_wholesale",
                description="DEMO DATA - Major wholesale bullion dealer and certified GIA gemstone importer with regional vault storage.",
                source_provider="industry_registry",
                source_identifier="sja-reg-002",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/sja-directory/orient-gold",
                        title="Singapore Jewellers Association Wholesale Listing",
                        evidence_excerpt="DEMO DATA: Major wholesale merchant expanding international vault capacity across ASEAN trade lanes.",
                        provider="sja_registry",
                        confidence=0.88,
                    )
                ],
            ),
            CandidateCompany(
                company_name="DEMO DATA - Sovereign Gemological Ateliers Pte Ltd",
                domain="sovereign-gems-demo.sg",
                country=market,
                city=market,
                address="DEMO DATA - 290 Orchard Road, Paragon, Singapore",
                phone="+65 6738 0001",
                industry="jewellery_retail",
                description="DEMO DATA duplicate entry for multi-stage deduplication validation.",
                source_provider="web_directory",
                source_identifier="web-dup-001",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="web_search_result",
                        source_url="https://example.com/search/sovereign-gems",
                        title="Commercial Directory Search Result",
                        evidence_excerpt="DEMO DATA: Observed new luxury retail location launch announcement.",
                        provider="web_directory",
                        confidence=0.80,
                    )
                ],
            ),
        ]
    elif "transit" in brand_lower or "jaguar" in brand_lower:
        return [
            CandidateCompany(
                company_name="DEMO DATA - Pacific Cross-Border Logistics",
                domain="pacific-freight-demo.com.sg",
                country=market,
                city=market,
                address="DEMO DATA - 15 Changi South Street 2, Singapore 486603",
                phone="+65 6542 0003",
                industry="logistics",
                description="DEMO DATA - TAPA-certified secure bonded carrier specializing in cross-border semiconductor and luxury freight.",
                source_provider="industry_registry",
                source_identifier="sla-reg-001",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/sla-directory/pacific-freight",
                        title="Singapore Logistics Association Certified Fleet",
                        evidence_excerpt="DEMO DATA: Expanding secure fleet and announced a new logistics route from Singapore to Penang.",
                        provider="sla_registry",
                        confidence=0.91,
                    )
                ],
            ),
            CandidateCompany(
                company_name="DEMO DATA - ASEAN Bonded Vault Transport",
                domain="asean-vault-demo.sg",
                country=market,
                city=market,
                address="DEMO DATA - 7 Airport Cargo Road, Changi, Singapore",
                phone="+65 6545 0004",
                industry="high_value_transport",
                description="DEMO DATA - Armoured transport operator providing high-security escort services for bank bullion and luxury goods.",
                source_provider="industry_registry",
                source_identifier="sla-reg-002",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/sla-directory/asean-vault",
                        title="Airport Air Cargo Security Directory",
                        evidence_excerpt="DEMO DATA: Distribution center expansion in Changi Airfreight Centre.",
                        provider="sla_registry",
                        confidence=0.87,
                    )
                ],
            ),
        ]
    else: # doctorshield
        return [
            CandidateCompany(
                company_name="DEMO DATA - Marina Bay Aesthetic & Surgical Specialist",
                domain="marinabay-aesthetics-demo.sg",
                country=market,
                city=market,
                address="DEMO DATA - 8A Marina Boulevard, Marina Bay Suites #02-01, Singapore 018984",
                phone="+65 6634 0005",
                industry="clinic",
                description="DEMO DATA - Day surgery and aesthetic cosmetic medicine clinic offering invasive laser and cosmetic procedures.",
                source_provider="industry_registry",
                source_identifier="moh-reg-001",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/moh-directory/marinabay-aesthetics",
                        title="Ministry of Health Licensed Medical Clinic Directory",
                        evidence_excerpt="DEMO DATA: Licensed medical facility. Welcomed a new specialist consultant and expanding services.",
                        provider="moh_registry",
                        confidence=0.94,
                    )
                ],
            ),
            CandidateCompany(
                company_name="DEMO DATA - Novena Orthopaedic & Sports Surgery Centre",
                domain="novena-ortho-demo.sg",
                country=market,
                city=market,
                address="DEMO DATA - 38 Irrawaddy Road, Mount Elizabeth Novena #08-22, Singapore 329563",
                phone="+65 6734 0006",
                industry="medical_practice",
                description="DEMO DATA - Multi-disciplinary orthopedic practice with complex joint reconstruction and sports medicine theatre.",
                source_provider="industry_registry",
                source_identifier="moh-reg-002",
                is_demo=True,
                evidence=[
                    SourceEvidence(
                        source_type="industry_directory",
                        source_url="https://example.com/moh-directory/novena-ortho",
                        title="Specialist Medical Centre Registry",
                        evidence_excerpt="DEMO DATA: Private practice opened a new clinic facility in Mount Elizabeth Novena.",
                        provider="moh_registry",
                        confidence=0.89,
                    )
                ],
            ),
        ]


class IndustrySourceProvider(DiscoveryProvider):
    """Industry Directory provider returning verified registry records and demo pool."""

    name = "industry_source"

    def discover(self, request: DiscoveryRequest) -> List[CandidateCompany]:
        logger.info(f"Retrieving industry directory records for {request.brand} in {request.market}")
        return get_demo_candidates(request.brand, request.market)
