from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.entities import Competitor
from app.services.llm_provider import llm_provider

logger = logging.getLogger("ja_assure.competitors.battlecard")


class BattlecardSchema(BaseModel):
    ja_product: str
    why_ja_wins: List[str] = Field(..., description="3-4 tactical bullet points on JA Assure advantages")
    where_competitor_wins: List[str] = Field(..., description="1-2 objective areas where competitor is strong")
    objection_handling: Dict[str, str] = Field(..., description="Common client objections mapped to sales rep counter-narratives")
    pricing_comparison: str = Field(..., description="1-2 sentences with benchmark comparison")
    sales_pitch_hook: str = Field(..., description="A powerful 1-sentence opening question or hook")


class BattlecardGenerator:
    """
    Generates and updates sales enablement battlecards comparing JA Assure products
    (Jade, Jaguar Transit, DoctorShield) against specific competitors.
    """

    PRODUCT_MAP = {
        "jewellery": "Jade",
        "transit": "Jaguar Transit",
        "medical": "DoctorShield",
    }

    def generate_battlecard(self, competitor: Competitor) -> Dict[str, Any]:
        category = (competitor.category or "").lower()
        ja_product = self.PRODUCT_MAP.get(category)
        if not ja_product:
            if competitor.brand:
                brand_lower = competitor.brand.lower()
                if "jade" in brand_lower:
                    ja_product = "Jade"
                elif "transit" in brand_lower:
                    ja_product = "Jaguar Transit"
                elif "doctor" in brand_lower or "shield" in brand_lower:
                    ja_product = "DoctorShield"
                else:
                    ja_product = "JA Assure"
            else:
                ja_product = "JA Assure"

        prompt = f"""You are a senior commercial insurance sales enablement director at JA Assure, an InsurTech firm partnered with Lloyd's of London coverholders.
Create a factual, tactical sales battlecard comparing JA Assure's product '{ja_product}' against competitor '{competitor.name}' in {competitor.market or 'Singapore'}.

Competitor Profile:
- Name: {competitor.name}
- Domain: {competitor.domain or competitor.url}
- Sector / Niche: {competitor.category}
- Underwriter / Capacity: {competitor.underwriter or 'Standard commercial underwriter'}
- Current Pricing Summary: {competitor.pricing_summary or 'Standard market rates'}
- Coverage Strengths: {competitor.coverage_strengths or 'Established brand presence'}
- Coverage Weaknesses: {competitor.coverage_weaknesses or 'Legacy manual proposal processes'}

Guidelines:
1. Do not fabricate negative competitor claims. Be professional, objective, and evidence-grounded.
2. Clearly highlight JA Assure differentiators: digital underwriting speed, Lloyd's A+ security, transparent pricing, streamlined warranties.
3. Acknowledge legitimate competitor strengths (e.g. legacy brand history, large balance sheets).
4. Provide actionable counter-narratives for sales reps facing common prospect objections.

Return structured output matching the schema."""

        parsed: Optional[BattlecardSchema] = None
        try:
            parsed = llm_provider.generate_structured(
                prompt=prompt,
                schema=BattlecardSchema,
                system_instruction="Create an objective, tactical sales battlecard. Do not fabricate unsupported claims."
            )
        except Exception as e:
            logger.warning(f"Structured battlecard generation failed for {competitor.name}: {e}")

        if parsed and not parsed.ja_product.startswith("Demo generated") and not (parsed.why_ja_wins and parsed.why_ja_wins[0].startswith("Demo")):
            data = parsed.model_dump()
            data["ja_product"] = ja_product
            return data

        # Deterministic insurance-accurate fallbacks by brand/niche
        if ja_product == "Jade":
            why_wins = [
                f"100% digital onboarding & instant quote comparison underwritten by Lloyd's of London coverholders (<24h turnaround vs {competitor.name}'s multi-week paper review).",
                "0% deductible options available for certified UL safe installations.",
                "Flexible unattended showcase sub-limits during business hours with proprietary risk-survey assistance.",
                "Direct broker / agent commission structure with real-time portfolio management dashboard.",
            ]
            where_wins = [
                f"{competitor.name} holds legacy brand recognition among traditional generation-1 jewellers.",
                "High single-risk balance sheet capacity for mega diamond vaults."
            ]
            objections = {
                f"We have used {competitor.name} for years": f"{competitor.name} is well known, but JA Assure Jade offers Lloyd's-backed contract certainty with 15-25% lower baseline premiums and streamlined warranty terms.",
                "Is JA Assure backed by an A-rated underwriter?": "Yes, Jade policies are placed through Lloyd's of London syndicates holding S&P A+ / AM Best A ratings.",
            }
            pricing = f"JA Assure Jade typically delivers 15-25% lower baseline premiums compared to {competitor.name} with faster digital issuance."
            hook = f"When did {competitor.name} last review your unattended showcase warranties or offer safe-security premium discounts?"

        elif ja_product == "Jaguar Transit":
            why_wins = [
                f"Courier-agnostic coverage: Jaguar Transit insures goods using approved express couriers (FedEx, DHL) or vetted staff, avoiding {competitor.name}'s mandatory armored fleet surcharges.",
                "Instant digital certificate of insurance issued in 60 seconds via web portal.",
                "Substantially lower cost-per-shipment (saving 35-50% on routine regional consignments).",
                "Automated API integration for eCommerce and luxury parcel dispatch.",
            ]
            where_wins = [
                f"{competitor.name} provides physical armored vehicles for multi-tonne bullion transfers.",
                "Specialized bonded fine art vault storage facilities."
            ]
            objections = {
                f"{competitor.name} handles our logistics and insurance together": f"For multi-million dollar gold bullion {competitor.name} is suited, but for routine luxury parcels, paying minimum armored consignment fees drains margin. Jaguar Transit covers parcels on express couriers with full Lloyd's specie backing.",
            }
            pricing = f"Jaguar Transit saves 35-50% on routine regional shipments compared to {competitor.name}'s minimum consignment handling rates."
            hook = f"Why pay armored truck minimum fees to transport a $50,000 watch when Jaguar Transit insures it door-to-door on express couriers?"

        elif ja_product == "DoctorShield":
            why_wins = [
                f"CONTRACT CERTAINTY: Regulated, legally binding insurance contract backed by S&P A+ rated insurers, unlike {competitor.name}'s discretionary mutual model where assistance can be denied.",
                "Predictable, transparent premium rates that are 15-30% lower for private aesthetic doctors and day-surgery specialists.",
                "Full Run-off / Extended Reporting Period (ERP) protection guaranteed upon retirement.",
                "Comprehensive coverage for Singapore Medical Council (SMC) disciplinary inquiry legal defense.",
            ]
            where_wins = [
                f"{competitor.name} possesses extensive clinical brand familiarity dating back decades in medical schools.",
                "Long-standing institutional relationships with senior hospital department heads."
            ]
            objections = {
                f"I've been with {competitor.name} since medical school": f"{competitor.name} is familiar, but discretionary mutuals are not legally obligated by insurance contract law to pay out. DoctorShield provides contract certainty, guaranteed policy limits, and predictable annual premiums.",
            }
            pricing = f"DoctorShield provides 15-30% premium savings compared to {competitor.name}'s escalating annual subscription rates."
            hook = f"Did you know that under {competitor.name}'s mutual constitution, legal defense assistance is discretionary and not a legally enforceable insurance contract?"

        else:
            why_wins = [
                f"100% digital onboarding with turnaround in hours vs {competitor.name}'s weeks-long paperwork.",
                "Underwritten through Lloyd's of London coverholders with S&P A+ financial security.",
                "Transparent pricing with tailored deductibles and zero hidden administrative surcharges.",
            ]
            where_wins = [
                f"{competitor.name} maintains established market history in Southeast Asia.",
            ]
            objections = {
                f"We are accustomed to {competitor.name}": f"JA Assure delivers modern InsurTech efficiency with Lloyd's S&P A+ security and significant administrative cost savings.",
            }
            pricing = f"JA Assure typically delivers 15-25% lower net premium compared to {competitor.name}."
            hook = f"When did {competitor.name} last update your policy terms to match modern digital risk requirements?"

        return {
            "ja_product": ja_product,
            "why_ja_wins": why_wins,
            "where_competitor_wins": where_wins,
            "objection_handling": objections,
            "pricing_comparison": pricing,
            "sales_pitch_hook": hook,
        }


battlecard_generator = BattlecardGenerator()
