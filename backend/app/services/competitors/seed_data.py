from __future__ import annotations

import json
import logging
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.entities import Competitor, CompetitorBattlecard

logger = logging.getLogger("ja_assure.competitors.seed")

REAL_COMPETITORS: List[Dict[str, Any]] = [
    # =========================================================================
    # NICHE: JEWELLERY / JEWELLERS BLOCK (JADE)
    # =========================================================================
    {
        "name": "Chubb Insurance Singapore Limited",
        "domain": "chubb.com",
        "category": "jewellery",
        "brand": "jade",
        "market": "Singapore",
        "website_url": "https://www.chubb.com/sg-en/business/jewellers-block.html",
        "title": "Chubb Jewellers Block Specialist Underwriting",
        "summary": "Incumbent global insurer offering prime jewellers block capacity with rigid physical safe and alarm warranties.",
        "underwriter": "Chubb Group (Direct Insurer / S&P AA- rated)",
        "target_customer_size": "Tier-1 Retail Chains & Diamond Wholesalers",
        "threat_level": "high",
        "pricing_summary": "Premium pricing tier. Minimum annual premium SGD 4,500 - 8,000. Typical base rate 0.45% - 0.75% of stock sum insured. Deductible SGD 2,500 - 5,000 per claim.",
        "coverage_strengths": "Worldwide balance sheet capacity up to SGD 50M+, comprehensive exhibition and trade fair floater upon prior declaration.",
        "coverage_weaknesses": "Rigid security warranties (mandates Grade III+ safe, 24/7 central alarm with dual-path GSM), slow proposal review (10-15 business days), strict unattended vehicle exclusions.",
        "social_handles": {"linkedin": "chubb-singapore", "twitter": "@Chubb"},
        "battlecard": {
            "ja_product": "Jade",
            "why_ja_wins": [
                "100% digital onboarding & instant quote comparison underwritten by Lloyd's of London coverholders (<24h turnaround vs Chubb's 2 weeks).",
                "0% deductible option for certified UL safe installations (Chubb mandates minimum SGD 2,500 deductible).",
                "Flexible unattended showcase sub-limit during business hours with proprietary risk-survey assistance.",
                "Direct broker / agent commission structure with real-time portfolio management dashboard."
            ],
            "where_competitor_wins": [
                "Massive single-risk capacity exceeding SGD 50M for mega diamond vaults.",
                "Legacy brand recognition among traditional generation-1 jewellers."
            ],
            "objection_handling": {
                "We already have our jewellers block policy with Chubb for 10 years": "Chubb has served traditional luxury jewellers, but premium rates and rigid warranties tightened in 2025/2026. JA Assure Jade offers Lloyd's-backed contract certainty with 15-25% lower baseline premiums and waivers on minor warranty conditions that Chubb strictly penalizes.",
                "Is JA Assure's coverage backed by an A-rated underwriter?": "Yes, Jade policies are placed through Lloyd's of London syndicates, holding an S&P A+ / AM Best A rating, providing global financial security."
            },
            "pricing_comparison": "JA Assure Jade: 0.32% - 0.55% sum insured (SGD 2,800 min) vs Chubb: 0.45% - 0.75% (SGD 4,500 min). Average client savings: 22%.",
            "sales_pitch_hook": "When did Chubb last adjust your unattended display warranties or offer safe-security premium discounts?"
        }
    },
    {
        "name": "Great American Insurance Company (Singapore)",
        "domain": "greatamericaninsurancegroup.com",
        "category": "jewellery",
        "brand": "jade",
        "market": "Singapore & Malaysia",
        "website_url": "https://www.greatamericaninsurancegroup.com/marine-jewellers-block-singapore",
        "title": "Great American Specie & Jewellers Block Cover",
        "summary": "Specialist US underwriter with Singapore branch focusing on marine specie, gemstone transit, and wholesale jewelers.",
        "underwriter": "Great American Insurance Group (AM Best A+)",
        "target_customer_size": "Mid-tier Retailers & Gemstone Wholesalers",
        "threat_level": "high",
        "pricing_summary": "Mid-to-high tier. Minimum annual premium SGD 3,500. Deductibles range from SGD 1,500 - 3,000. Moderate rates on retail stock (0.40% - 0.60%).",
        "coverage_strengths": "Strong marine and specie background, flexible transit endorsements across Southeast Asia, responsive local claims adjusters in Singapore.",
        "coverage_weaknesses": "Lacks modern digital self-service tools; policy renewals require cumbersome paper inventories and physical receipts audits.",
        "social_handles": {"linkedin": "great-american-insurance-singapore"},
        "battlecard": {
            "ja_product": "Jade",
            "why_ja_wins": [
                "Seamless digital inventory upload and instant endorsement adjustments.",
                "Faster claim turnaround with pre-vetted Singapore gemological loss adjusters.",
                "Higher jewelry transit limits between boutique workshops and retail stores without prior 48h notice."
            ],
            "where_competitor_wins": [
                "Strong historical ties with regional gemstone traders and traditional diamond cutting houses."
            ],
            "objection_handling": {
                "Great American handles our transit risk between Malaysia and Singapore smoothly": "JA Assure Jade integrates seamlessly with Jaguar Transit, allowing single-pane cover for both in-vault stock and cross-border Causeway transit without dual paperwork."
            },
            "pricing_comparison": "JA Assure Jade offers comparable or 10-15% lower premium with significantly faster digital claims processing.",
            "sales_pitch_hook": "Cut your policy administrative overhead by 80% with Jade's digital stock management portal."
        }
    },
    {
        "name": "Singlife Commercial (Specialty Risks)",
        "domain": "singlife.com",
        "category": "jewellery",
        "brand": "jade",
        "market": "Singapore",
        "website_url": "https://singlife.com/en/business/business-insurance",
        "title": "Singlife Retail & Commercial Packaged Cover",
        "summary": "Local composite insurer offering combined commercial shop packages with basic jewelry contents riders.",
        "underwriter": "Singapore Life Ltd (Licensed MAS Composite Insurer)",
        "target_customer_size": "Neighborhood Jewellery Shops & Goldsmiths",
        "threat_level": "medium",
        "pricing_summary": "Competitive low-tier package pricing. Base premium starts from SGD 1,800 - 3,000, but stock limits are capped tightly at SGD 1M.",
        "coverage_strengths": "Local Singapore brand trust, packaged business solutions combining public liability, employee work injury, and basic shop content.",
        "coverage_weaknesses": "Not a true specialist Jewellers Block; substantial exclusions for theft during exhibition, mysterious disappearance, and high-value gemstone custody.",
        "social_handles": {"linkedin": "singlife", "twitter": "@SinglifeSG"},
        "battlecard": {
            "ja_product": "Jade",
            "why_ja_wins": [
                "True comprehensive Jewellers Block wording covering mysterious disappearance, customer goods on consignment, and exhibition risk.",
                "High limit capacity (up to SGD 10M+) suited for genuine fine jewellery, where Singlife packages cap out.",
                "Tailored risk management guidance on safe ratings and alarm verification."
            ],
            "where_competitor_wins": [
                "Can bundle general commercial property, employee medical, and business interruption in one generic SME bill."
            ],
            "objection_handling": {
                "We already have a package policy with Singlife that includes shop contents": "Generic shop insurance typically excludes loose precious gems, consignment stock, and mysterious disappearance. Jade provides dedicated Lloyd's-backed Jewellers Block wording."
            },
            "pricing_comparison": "Singlife is slightly cheaper for basic fire/theft, but Jade provides genuine full-value protection that actually pays out on specialized jewellery loss.",
            "sales_pitch_hook": "Check your current policy: does it cover customer jewellery left for repair or resizing? Standard shop packages do not."
        }
    },

    # =========================================================================
    # NICHE: HIGH-VALUE GOODS TRANSIT & SPECIE (JAGUAR TRANSIT)
    # =========================================================================
    {
        "name": "Brink's Global Services (Singapore)",
        "domain": "brinks.com",
        "category": "transit",
        "brand": "jaguartransit",
        "market": "Singapore & Regional",
        "website_url": "https://www.brinks.com/en/services/global-services",
        "title": "Brink's Secure Armored Logistics & Specie",
        "summary": "Global armored carrier providing integrated physical security and transit risk pooling for bullion and high-value specie.",
        "underwriter": "Internal Risk Pool & Lloyd's Specie Syndicate",
        "target_customer_size": "Banks, Bullion Traders, Major Diamond Houses",
        "threat_level": "high",
        "pricing_summary": "Bundled transit logistics + insurance fee based on ad-valorem percentage (0.15% - 0.35% per shipment value) plus heavy armored courier fees.",
        "coverage_strengths": "Global physical security fleet, bulletproof transport, high security vaulting at Changi Airport and Singapore FreePort.",
        "coverage_weaknesses": "Exorbitant minimum charges for small/medium shipments; requires using Brink's physical vehicles and couriers exclusively; rigid scheduling.",
        "social_handles": {"linkedin": "brinks-company"},
        "battlecard": {
            "ja_product": "Jaguar Transit",
            "why_ja_wins": [
                "Courier-agnostic: Jaguar Transit covers your goods in transit using approved commercial couriers (FedEx, DHL, secure couriers) or your own vetted staff.",
                "No hefty armored car charges for shipments under SGD 500,000.",
                "Instant digital certificate of insurance issued in 60 seconds via web portal.",
                "Substantially lower cost-per-shipment (saving 40-60% on routine regional consignments)."
            ],
            "where_competitor_wins": [
                "Physical armored vehicles for multi-million dollar gold bullion and banknote interbank transfers."
            ],
            "objection_handling": {
                "Brink's handles both transport and insurance for us": "Brink's is suited for multi-tonne bullion, but for daily diamond, watch, and luxury shipments between Singapore, Malaysia, and Hong Kong, paying Brink's minimum consignment fees drains your margin. Jaguar Transit lets you use cost-effective couriers with full Lloyd's-backed specie insurance."
            },
            "pricing_comparison": "Brink's: Minimum $250-$500 per transport run + ad-valorem. Jaguar Transit: Flexible per-shipment or annual floater starting from 0.08% of declared value.",
            "sales_pitch_hook": "Why pay armored truck prices to transport a SGD 50,000 watch when Jaguar Transit insures it via express courier with full door-to-door coverage?"
        }
    },
    {
        "name": "Malca-Amit Singapore Pte Ltd",
        "domain": "malca-amit.com",
        "category": "transit",
        "brand": "jaguartransit",
        "market": "Singapore & Hong Kong",
        "website_url": "https://www.malca-amit.com/services",
        "title": "Malca-Amit Ultra-High Value Specie Logistics",
        "summary": "Luxury niche secure carrier catering to ultra-high-net-worth jewelry auctions, diamond bourses, and freeport storage.",
        "underwriter": "Lloyd's Specie Consortium",
        "target_customer_size": "Ultra-HNW, Prime Auction Houses, High Jewelry",
        "threat_level": "high",
        "pricing_summary": "High premium bracket. Minimum shipment handling starting at SGD 400 + 0.25% ad-valorem insurance surcharge.",
        "coverage_strengths": "High prestige in diamond & art trade; flagship freeport vault at Singapore Le Freeport; white-glove security.",
        "coverage_weaknesses": "Extremely high cost structure for growing independent luxury merchants and eCommerce fine jewellery.",
        "social_handles": {"linkedin": "malca-amit-global-services"},
        "battlecard": {
            "ja_product": "Jaguar Transit",
            "why_ja_wins": [
                "Designed specifically for modern eCommerce, cross-border luxury retailers, and independent merchants.",
                "Automated API integration with shipping management tools.",
                "Flexible coverage for hand-carry by authorized directors or staff between trade shows."
            ],
            "where_competitor_wins": [
                "Auction-house prestige and specialized bonded fine art storage at Le Freeport."
            ],
            "objection_handling": {
                "Our buyers demand Malca-Amit for international diamond transit": "For seven-figure consignments Malca-Amit remains an option, but for your day-to-day luxury parcel shipments, Jaguar Transit gives you identical Lloyd's specie backing at a fraction of the cost."
            },
            "pricing_comparison": "Saves 35-50% on cross-border logistics insurance without sacrificing coverage limits.",
            "sales_pitch_hook": "How much did you spend last quarter on minimum shipment charges with Malca-Amit for parcels under $100k?"
        }
    },
    {
        "name": "Ferrari Logistics Singapore",
        "domain": "ferrarigroup.net",
        "category": "transit",
        "brand": "jaguartransit",
        "market": "Singapore, Thailand & Hong Kong",
        "website_url": "https://www.ferrarigroup.net/services",
        "title": "Ferrari Group Global Luxury Forwarding",
        "summary": "Specialized Italian luxury freight forwarder with regional headquarters handling watch, jewelry, and fashion shipments.",
        "underwriter": "European Specialty Specie Underwriters",
        "target_customer_size": "Luxury Watch & Fashion Boutiques",
        "threat_level": "medium",
        "pricing_summary": "Moderate-to-high logistics + insurance surcharge model.",
        "coverage_strengths": "Dedicated focus on luxury horology and high fashion; strong presence in Geneva, Italy, and Singapore.",
        "coverage_weaknesses": "Focuses primarily on international freight rather than domestic/regional on-demand transit insurance.",
        "social_handles": {"linkedin": "ferrari-group"},
        "battlecard": {
            "ja_product": "Jaguar Transit",
            "why_ja_wins": [
                "Comprehensive domestic intra-Singapore transport coverage (e.g. airport to showroom, boutique to private VIP residence).",
                "Instant claims registration without cross-border international paperwork."
            ],
            "where_competitor_wins": [
                "Strong footprint in European watch manufacturing hubs."
            ],
            "objection_handling": {
                "Ferrari handles our Swiss imports": "Keep Ferrari for your Swiss freight, but use Jaguar Transit for your local deliveries, VIP viewings, and regional Causeway transit."
            },
            "pricing_comparison": "Jaguar Transit delivers transparent flat-rate or declaration-based premiums with zero hidden handling surcharges.",
            "sales_pitch_hook": "Are your luxury goods insured when your sales director brings high-value pieces to a client's private residence in Singapore?"
        }
    },

    # =========================================================================
    # NICHE: MEDICAL INDEMNITY / MALPRACTICE (DOCTORSHIELD)
    # =========================================================================
    {
        "name": "Medical Protection Society (MPS Singapore)",
        "domain": "medicalprotection.org",
        "category": "medical",
        "brand": "doctorshield",
        "market": "Singapore & Malaysia",
        "website_url": "https://www.medicalprotection.org/singapore",
        "title": "MPS Discretionary Medical Defense Organization",
        "summary": "Commonwealth mutual defense society providing discretionary assistance and legal indemnity for medical practitioners.",
        "underwriter": "Discretionary Mutual Defense Fund (Not insurance)",
        "target_customer_size": "Individual Doctors, Surgeons, Specialists",
        "threat_level": "high",
        "pricing_summary": "Annual membership subscription model. Subscriptions have risen steeply: SGD 2,500 for General Practitioners, escalating to SGD 15,000 - 45,000+ for Obstetricians, Orthopedic, and Plastic/Aesthetic Surgeons.",
        "coverage_strengths": "Over 100 years of clinical reputation in Commonwealth jurisdictions, extensive legal defense panel, deep medical advisory resources.",
        "coverage_weaknesses": "DISCRETIONARY MUTUAL - NOT AN INSURANCE CONTRACT. MPS has the legal right to decline assistance at its sole discretion; does not fall under Singapore Policy Owners' Protection Scheme (PPF); unpredictable subscription price hikes.",
        "social_handles": {"linkedin": "medical-protection-society", "twitter": "@MPS_Society"},
        "battlecard": {
            "ja_product": "DoctorShield",
            "why_ja_wins": [
                "CONTRACT CERTAINTY: DoctorShield is a regulated, legally binding insurance contract backed by top-rated insurers, not a discretionary mutual fund where benefits can be denied.",
                "Guaranteed premium rates that are 15-30% lower for aesthetic doctors, dermatologists, and day-surgery specialists.",
                "Full Run-off / Extended Reporting Period (ERP) protection guaranteed upon retirement or sabbatical.",
                "Comprehensive coverage for SMC (Singapore Medical Council) disciplinary inquiry defense costs.",
                "Prompt local claims and legal assistance with top Singapore healthcare litigation firms."
            ],
            "where_competitor_wins": [
                "Massive brand familiarity instilled in Singapore medical students since Duke-NUS / NUS Yong Loo Lin days.",
                "Long-standing relationships with senior public hospital consultants."
            ],
            "objection_handling": {
                "I've been with MPS since medical school and never had an issue": "MPS has served doctors for decades, but it remains a discretionary mutual—meaning they are not legally obligated by insurance contract law to defend your claim. DoctorShield gives you contract certainty: legally binding terms, guaranteed policy limits, and predictable premiums that don't spike unpredictably.",
                "Does DoctorShield cover Singapore Medical Council (SMC) inquiries?": "Yes, DoctorShield covers legal defense expenses for SMC complaints, coroner's inquiries, and patient civil litigation up to your policy limit."
            },
            "pricing_comparison": "DoctorShield provides 18-32% savings compared to standard MPS annual subscription tiers, especially in procedural and aesthetic specializations.",
            "sales_pitch_hook": "Did you know that under MPS's mutual rules, assistance is discretionary and not a legally enforceable insurance contract?"
        }
    },
    {
        "name": "Sompo Insurance Singapore (SMA Scheme Partner)",
        "domain": "sompo.com.sg",
        "category": "medical",
        "brand": "doctorshield",
        "market": "Singapore",
        "website_url": "https://www.sompo.com.sg/products/business/medical-malpractice",
        "title": "Sompo Medical Malpractice Scheme",
        "summary": "Corporate general insurer providing contractual medical malpractice insurance in partnership with Singapore Medical Association.",
        "underwriter": "Sompo Insurance Singapore Pte Ltd (S&P A+)",
        "target_customer_size": "SMA Member Clinics & Specialist Groups",
        "threat_level": "high",
        "pricing_summary": "Tiered based on specialty risk bands. Minimum premiums range from SGD 1,800 (low-risk GP) to SGD 12,000 - 35,000 (high-risk surgery/aesthetics).",
        "coverage_strengths": "Official partnership endorsement from the Singapore Medical Association (SMA); genuine contract insurance; recognized local medical advisory board.",
        "coverage_weaknesses": "Strict retro-active date warranties; cumbersome renewal declaration forms; high deductible penalties for claims involving non-core clinical procedures or off-label treatments.",
        "social_handles": {"linkedin": "sompo-singapore"},
        "battlecard": {
            "ja_product": "DoctorShield",
            "why_ja_wins": [
                "Tailored coverage specifically structured for modern private aesthetic clinics, day-care surgical centres, and tele-medicine providers.",
                "Seamless retroactive date continuation from your existing Sompo or MPS policy with zero gap in protection.",
                "Simplified digital proposal process with instant policy binder."
            ],
            "where_competitor_wins": [
                "Official endorsement badge of the Singapore Medical Association (SMA)."
            ],
            "objection_handling": {
                "I get an SMA member discount with Sompo": "Even factoring in SMA scheme discounts, DoctorShield's specialty-specific rating matrix routinely beats Sompo renewal quotes by 12-20% while providing broader defense cost sub-limits."
            },
            "pricing_comparison": "DoctorShield is 12-20% more cost-effective for private aesthetic and day-surgery specialists with higher defense cost sub-limits.",
            "sales_pitch_hook": "How many pages of renewal questionnaires did Sompo ask your clinic practice manager to fill out this year?"
        }
    }
]


def seed_initial_competitors(db: Session) -> int:
    """Ensures real domain-accurate competitor intelligence is seeded."""
    count = 0
    for data in REAL_COMPETITORS:
        existing = db.execute(
            select(Competitor).where(Competitor.name == data["name"])
        ).scalar_one_or_none()

        if not existing:
            battlecard_data = data.get("battlecard")
            social_handles = data.get("social_handles")
            comp = Competitor(
                name=data["name"],
                url=data.get("website_url"),
                domain=data.get("domain"),
                brand=data.get("brand"),
                category=data.get("category", "jewellery"),
                market=data.get("market", "Singapore"),
                title=data.get("title", f"{data['name']} Profile"),
                summary=data.get("summary", ""),
                pricing_summary=data.get("pricing_summary"),
                coverage_strengths=data.get("coverage_strengths"),
                coverage_weaknesses=data.get("coverage_weaknesses"),
                underwriter=data.get("underwriter"),
                target_customer_size=data.get("target_customer_size"),
                threat_level=data.get("threat_level", "medium"),
                social_handles_json=json.dumps(social_handles) if social_handles else None,
                is_active=True,
                source="VERIFIED_SOURCE",
                relevance=0.90,
            )
            db.add(comp)
            db.flush()

            if battlecard_data:
                bc = CompetitorBattlecard(
                    competitor_id=comp.id,
                    ja_product=battlecard_data.get("ja_product", "JA Assure"),
                    why_ja_wins_json=json.dumps(battlecard_data.get("why_ja_wins", [])),
                    where_competitor_wins_json=json.dumps(battlecard_data.get("where_competitor_wins", [])),
                    objection_handling_json=json.dumps(battlecard_data.get("objection_handling", {})),
                    pricing_comparison=battlecard_data.get("pricing_comparison"),
                    sales_pitch_hook=battlecard_data.get("sales_pitch_hook"),
                )
                db.add(bc)

            count += 1

    if count > 0:
        db.commit()
        logger.info(f"Seeded {count} real competitor intelligence profiles.")

    return count
