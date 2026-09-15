import logging
from typing import List, Optional, Dict, Any
from app.schemas.agent_contracts import LeadProspect, LeadScoringBreakdown
from app.models.entities import Lead
from app.database.session import SessionLocal

logger = logging.getLogger("ja_assure.leads")

DEMO_PROSPECTS_POOL = [
    {
        "name": "Dr. Cheryl Goh",
        "company": "Marina Bay Aesthetics & Laser Centre",
        "industry": "Medical / Dermatology & Cosmetic Surgery",
        "email": "dr.goh@marinabayaesthetics.sg",
        "location": "Singapore",
        "company_size": "15-30 staff",
        "target_brand": "doctorshield",
        "profile_notes": "High volume cosmetic injectable and laser procedures requiring specialist indemnity."
    },
    {
        "name": "Dato' Raymond Tan",
        "company": "Royal Pavilions Fine Jewellery",
        "industry": "Luxury Goods & Haute Horlogerie",
        "email": "raymond@royalpavilions.my",
        "location": "Kuala Lumpur, Malaysia",
        "company_size": "20-50 staff",
        "target_brand": "jade",
        "profile_notes": "Bespoke diamond atelier and certified Patek Philippe & Rolex collector showcases."
    },
    {
        "name": "Kenji Takahashi",
        "company": "TransPacific Valuables Logistics",
        "industry": "Secured Freight & Cargo Transport",
        "email": "k.takahashi@transpacific-logistics.com",
        "location": "Singapore & Johor Bahru",
        "company_size": "50-100 staff",
        "target_brand": "jaguartransit",
        "profile_notes": "Cross-border bonded trucking and air freight of microchips and luxury goods."
    },
    {
        "name": "Dr. Arisara Wong",
        "company": "Bangkok Orthopaedic & Sports Medicine",
        "industry": "Orthopaedic Surgery Clinic",
        "email": "info@bangkokortho.co.th",
        "location": "Bangkok, Thailand",
        "company_size": "30-60 staff",
        "target_brand": "doctorshield",
        "profile_notes": "High surgical exposure with active telemedicine follow-up consultations."
    },
    {
        "name": "Elena Wijaya",
        "company": "Nusantara Heritage Gemstones",
        "industry": "Precious Stones & Heritage Jewellery",
        "email": "contact@nusantaragem.co.id",
        "location": "Jakarta, Indonesia",
        "company_size": "10-25 staff",
        "target_brand": "jade",
        "profile_notes": "Rare sapphire and emerald importer exhibiting at regional luxury fairs."
    }
]

class LeadService:
    """
    Lead Discovery, Transparent Scoring, and Personalized Outreach Engine.
    """

    def calculate_score(
        self,
        industry: str,
        company: str,
        location: str,
        company_size: Optional[str] = None,
        brand: Optional[str] = None
    ) -> LeadScoringBreakdown:
        """
        Transparent 5-factor scoring model totaling 0-100.
        """
        industry_lower = industry.lower()
        loc_lower = location.lower()
        
        # 1. Industry fit (max 25)
        if any(w in industry_lower for w in ["cosmetic", "plastic", "surgeon", "orthopaedic", "medical", "clinic"]):
            industry_fit = 24.0
        elif any(w in industry_lower for w in ["jewellery", "jewelry", "gemstone", "horlogerie", "diamonds"]):
            industry_fit = 23.5
        elif any(w in industry_lower for w in ["freight", "logistics", "cargo", "courier", "transport"]):
            industry_fit = 23.0
        else:
            industry_fit = 14.0

        # 2. Company profile (max 20)
        company_profile = 18.0 if company_size and any(s in company_size for s in ["15", "20", "30", "50"]) else 15.0

        # 3. Geographic relevance (max 20) - SG, MY, TH, ID focus
        if any(c in loc_lower for c in ["singapore", "sg"]):
            geo_fit = 20.0
        elif any(c in loc_lower for c in ["malaysia", "kuala lumpur", "johor"]):
            geo_fit = 19.0
        elif any(c in loc_lower for c in ["thailand", "bangkok"]):
            geo_fit = 18.0
        elif any(c in loc_lower for c in ["indonesia", "jakarta"]):
            geo_fit = 17.5
        else:
            geo_fit = 10.0

        # 4. Product relevance (max 20)
        product_relevance = 19.0 if brand in ["jade", "doctorshield", "jaguartransit"] else 16.0

        # 5. Potential insurance need (max 15)
        potential_need = 14.0 if ("surgery" in industry_lower or "precious" in industry_lower or "valuables" in industry_lower) else 11.0

        total = industry_fit + company_profile + geo_fit + product_relevance + potential_need

        return LeadScoringBreakdown(
            industry_fit=round(industry_fit, 1),
            company_profile=round(company_profile, 1),
            geographic_relevance=round(geo_fit, 1),
            product_relevance=round(product_relevance, 1),
            potential_insurance_need=round(potential_need, 1),
            total_fit_score=round(total, 1)
        )

    def generate_outreach(
        self,
        prospect_name: str,
        company: str,
        brand: str,
        industry: str,
        location: Optional[str] = None,
        research_context: Optional[str] = None
    ) -> str:
        """
        Generate tailored B2B outreach messaging adhering to brand voice,
        incorporating location and market research context.
        """
        loc_str = f" in {location}" if location else ""
        context_str = f" Given recent shifts ({research_context}), " if research_context else " "

        if brand == "jade":
            return (
                f"Dear {prospect_name},\n\n"
                f"We have been following {company}'s distinguished presence in {industry}{loc_str}.{context_str}"
                f"As bespoke high-value collections frequently exceed conventional policy sub-limits (often capped at $2,500), "
                f"Jade by JA Assure provides agreed-value protection with seamless worldwide exhibition transit.\n\n"
                f"Would you be open to a brief 5-minute private conversation on protecting your clients' collector inventory?\n\n"
                f"Warm regards,\nJA Assure Jade Advisory"
            )
        elif brand == "doctorshield":
            return (
                f"Dear {prospect_name},\n\n"
                f"Given {company}'s active procedural focus in {industry}{loc_str},{context_str}"
                f"maintaining comprehensive medical professional indemnity with immediate panel legal counsel is essential for career protection.\n\n"
                f"DoctorShield offers tailored retroactive coverage specifically structured for private specialist clinics. "
                f"We would welcome the opportunity to share our concise indemnity overview.\n\n"
                f"Respectfully,\nDoctorShield Medico-Legal Partnerships"
            )
        else: # jaguartransit
            return (
                f"Dear {prospect_name},\n\n"
                f"In high-value cargo transport across regional corridors,{context_str}"
                f"unexpected port delays and transit handoffs introduce unacceptable balance-sheet exposure. "
                f"Jaguar Transit offers vault-grade door-to-door insurance with active GPS escort protection.\n\n"
                f"We would be glad to review {company}'s transit routes to optimize cargo deductibles and claim turnaround.\n\n"
                f"Best regards,\nJaguar Transit Operations"
            )

    async def discover_and_score_leads(self, brand: Optional[str] = None, industry: Optional[str] = None) -> List[LeadProspect]:
        """
        Discover high-fit prospects, score them transparently, draft outreach, and store them in the DB.
        """
        db = SessionLocal()
        results: List[LeadProspect] = []
        try:
            from app.services.research_service import research_service
            pool = DEMO_PROSPECTS_POOL
            if brand:
                pool = [p for p in pool if p["target_brand"] == brand.lower()]
            if industry:
                pool = [p for p in pool if industry.lower() in p["industry"].lower()]

            for item in pool:
                target_brand = item["target_brand"]
                scoring = self.calculate_score(
                    industry=item["industry"],
                    company=item["company"],
                    location=item["location"],
                    company_size=item.get("company_size"),
                    brand=target_brand
                )
                
                # Fetch relevant research context for outreach
                research_cues = research_service.get_relevant_research_context(target_brand, item["industry"])
                top_cue = research_cues[0].split("|")[0] if research_cues else None

                outreach = self.generate_outreach(
                    prospect_name=item["name"],
                    company=item["company"],
                    brand=target_brand,
                    industry=item["industry"],
                    location=item.get("location"),
                    research_context=top_cue
                )

                qualification = (
                    f"Scored {scoring.total_fit_score}/100 based on {item['industry']} risk profile, "
                    f"{item['location']} jurisdiction, and direct {target_brand} coverage match."
                )

                prospect = LeadProspect(
                    name=item["name"],
                    company=item["company"],
                    industry=item["industry"],
                    email=item.get("email"),
                    location=item.get("location"),
                    company_size=item.get("company_size"),
                    recommended_brand=target_brand,
                    fit_score=scoring.total_fit_score,
                    qualification_reason=qualification,
                    outreach_draft=outreach,
                    source="prospect_discovery_agent",
                    scoring_breakdown=scoring
                )
                results.append(prospect)

                # Upsert into database if not already present
                existing = db.query(Lead).filter(Lead.company == item["company"]).first()
                if not existing:
                    new_lead = Lead(
                        name=prospect.name,
                        company=prospect.company,
                        industry=prospect.industry,
                        email=prospect.email,
                        location=prospect.location,
                        company_size=prospect.company_size,
                        fit_score=prospect.fit_score,
                        qualification_reason=prospect.qualification_reason,
                        recommended_brand=prospect.recommended_brand,
                        outreach_draft=prospect.outreach_draft,
                        source=prospect.source,
                        status="qualified" if prospect.fit_score >= 80 else "new"
                    )
                    db.add(new_lead)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error discovering and scoring leads: {e}")
        finally:
            db.close()

        return results

lead_service = LeadService()
