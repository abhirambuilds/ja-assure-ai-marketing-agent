from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class BrandConfig:
    product: str
    industries: List[str]
    markets: List[str]
    discovery_queries: List[str]
    signal_types: List[str]
    decision_maker_roles: List[str]
    scoring_weights: Dict[str, int]
    outreach_tone: str


DEFAULT_SCORING_WEIGHTS: Dict[str, int] = {
    "industry_fit": 25,
    "company_relevance": 20,
    "geographic_fit": 20,
    "product_fit": 20,
    "trigger_strength": 15,
}

BRAND_CONFIGS: Dict[str, BrandConfig] = {
    "jade": BrandConfig(
        product="Jade Jewellers Block & High-Net-Worth Jewellery Insurance",
        industries=["jewellery", "jewellery_retail", "jewellery_manufacturing", "jewellery_wholesale", "diamond_merchant", "luxury_goods"],
        markets=["Singapore", "Malaysia", "Hong Kong", "Indonesia", "Thailand"],
        discovery_queries=[
            "jewellery stores in {market}",
            "jewellery retailers in {market}",
            "fine jewellery boutiques in {market}",
            "diamond merchants and jewellers in {market}",
            "luxury jewellery showrooms in {market}",
            "wholesale jewellery suppliers in {market}",
            "gold and gemstone traders in {market}",
        ],
        signal_types=[
            "new_showroom",
            "new_location",
            "expansion",
            "new_branch",
            "acquisition",
            "partnership",
            "international_expansion",
            "warehouse_expansion",
            "trade_event",
            "business_launch",
            "hiring_activity",
        ],
        decision_maker_roles=["owner", "founder", "managing director", "CEO", "COO", "risk manager", "finance director"],
        scoring_weights=DEFAULT_SCORING_WEIGHTS,
        outreach_tone="concise, professional, cautious, evidence-backed",
    ),
    "jaguartransit": BrandConfig(
        product="Jaguar Transit High-Value Goods & Cargo Transit Insurance",
        industries=["logistics", "freight", "courier", "high_value_transport", "bonded_warehouse", "supply_chain"],
        markets=["Singapore", "Malaysia", "Hong Kong", "Indonesia", "Thailand"],
        discovery_queries=[
            "freight forwarders in {market}",
            "logistics companies in {market}",
            "high value cargo transport in {market}",
            "secure courier logistics in {market}",
            "bonded warehouse logistics in {market}",
            "air freight cargo services in {market}",
        ],
        signal_types=[
            "new_logistics_route",
            "fleet_expansion",
            "warehouse_expansion",
            "cross_border_expansion",
            "distribution_center",
            "logistics_partnership",
            "expansion",
            "partnership",
        ],
        decision_maker_roles=["managing director", "operations director", "VP operations", "cargo security manager", "risk manager", "finance director"],
        scoring_weights=DEFAULT_SCORING_WEIGHTS,
        outreach_tone="operational, concise, evidence-backed",
    ),
    "doctorshield": BrandConfig(
        product="DoctorShield Medical Indemnity & Malpractice Protection",
        industries=["clinic", "doctor", "medical_practice", "healthcare_group", "specialist_centre", "aesthetic_clinic"],
        markets=["Singapore", "Malaysia", "Hong Kong", "Indonesia", "Thailand"],
        discovery_queries=[
            "private medical clinics in {market}",
            "specialist medical centres in {market}",
            "aesthetic clinics and healthcare in {market}",
            "day surgery centres in {market}",
            "private healthcare groups in {market}",
        ],
        signal_types=[
            "new_clinic",
            "new_medical_center",
            "new_branch",
            "new_specialist",
            "new_practice",
            "healthcare_expansion",
            "expansion",
            "partnership",
        ],
        decision_maker_roles=["medical director", "practice owner", "founder", "chief surgeon", "managing director", "operations director"],
        scoring_weights=DEFAULT_SCORING_WEIGHTS,
        outreach_tone="respectful, concise, evidence-backed",
    ),
}

# Synonyms/aliases for brand lookup
BRAND_ALIASES: Dict[str, str] = {
    "jade": "jade",
    "jewellery": "jade",
    "jaguartransit": "jaguartransit",
    "jaguar transit": "jaguartransit",
    "transit": "jaguartransit",
    "cargo": "jaguartransit",
    "doctorshield": "doctorshield",
    "doctor shield": "doctorshield",
    "medical": "doctorshield",
}


def get_brand_config(brand_name: str | None) -> BrandConfig:
    key = (brand_name or "doctorshield").lower().replace(" ", "").replace("_", "")
    resolved = BRAND_ALIASES.get(key, "doctorshield")
    return BRAND_CONFIGS.get(resolved, BRAND_CONFIGS["doctorshield"])
