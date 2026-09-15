import logging
from typing import Dict, Any, List, Optional
from app.schemas.agent_contracts import VideoScript, VideoScene
from app.services.llm_provider import llm_provider

logger = logging.getLogger("ja_assure.media")

class MediaService:
    """
    Video/Reels Storyboard and Visual Pipeline Service.
    Produces 30-60 second structured scripts with scene-by-scene visual cues,
    voiceover text, on-screen typography, and mandatory compliance disclaimers.
    """

    async def generate_video_script(
        self,
        brand: str,
        topic: str,
        target_duration: int = 45,
        concept_notes: Optional[str] = None
    ) -> VideoScript:
        brand_clean = brand.lower()

        # Concept guidance per brand
        if brand_clean == "jade":
            concept = concept_notes or f"The Hidden $2,500 Sub-Limit in Home Insurance: Safeguarding Heirlooms with {brand.title()}"
            tone = "Sophisticated, authoritative, reassuring luxury tone"
            disclaimer = "JA Assure Jade is underwritten by licensed partner insurers. Terms and conditions apply."
            cta = "Link in bio to calculate your bespoke jewellery agreed-value coverage."
            scenes = [
                VideoScene(
                    scene_number=1,
                    duration_seconds=10,
                    visual_description="Cinematic macro shot of a diamond engagement ring placed next to a luxury watch on a velvet tray.",
                    voiceover="Most collectors assume their precious heirlooms are completely protected under home insurance. But have you read the fine print on unscheduled sub-limits?",
                    onscreen_text="Did you know? Standard home policies often cap jewellery at $2,500."
                ),
                VideoScene(
                    scene_number=2,
                    duration_seconds=15,
                    visual_description="Split screen transition: Left side shows a generic rejected claim letter; Right side shows a certified gemologist appraisal with a Jade seal.",
                    voiceover="If a rare diamond or luxury watch is lost or stolen during your travels, a standard policy may only reimburse a fraction of its true appraisal value.",
                    onscreen_text="Agreed-Value Collector Protection vs General Sub-Limits"
                ),
                VideoScene(
                    scene_number=3,
                    duration_seconds=12,
                    visual_description="Smooth panning shot of a traveler boarding a flight wearing the luxury watch, glowing subtle shield overlay.",
                    voiceover="Jade by JA Assure covers your pieces worldwide with zero deductible on certified appraisals. No disputes, no depreciation deductions.",
                    onscreen_text="Worldwide Transit & Travel • Zero Deductible Available"
                ),
                VideoScene(
                    scene_number=4,
                    duration_seconds=8,
                    visual_description="Elegant dark blue Jade branding card with subtle gold accents and verified broker badge.",
                    voiceover="Protect what you cherish. Get your 2-minute bespoke quote today.",
                    onscreen_text="Jade by JA Assure | Protect Your Legacy | Link in Bio"
                )
            ]
        elif brand_clean == "doctorshield":
            concept = concept_notes or f"Navigating Telemedicine & Malpractice Liabilities with {brand.title()}"
            tone = "Clinical, calm, highly trustworthy and empathetic"
            disclaimer = "DoctorShield is a medical professional indemnity insurance product. Policy terms and conditions apply."
            cta = "Visit doctorshield.asia to review tailored indemnity for private specialists."
            scenes = [
                VideoScene(
                    scene_number=1,
                    duration_seconds=10,
                    visual_description="Specialist physician reviewing patient electronic health records on a tablet in a modern private consultation room.",
                    voiceover="In modern medicine, care extends beyond clinical walls. But virtual consultations introduce unprecedented cross-border medico-legal complexities.",
                    onscreen_text="Telehealth is Expanding. Are Your Indemnity Limits Protected?"
                ),
                VideoScene(
                    scene_number=2,
                    duration_seconds=15,
                    visual_description="Gavel graphic morphing into legal counsel documents with medical liability timeline icons.",
                    voiceover="A single legal inquiry can consume hundreds of hours away from patient care. Traditional indemnities often enforce strict panel restrictions or omit retroactive coverage.",
                    onscreen_text="Comprehensive Panel Defence Counsel + Retroactive Inception Protection"
                ),
                VideoScene(
                    scene_number=3,
                    duration_seconds=12,
                    visual_description="Doctor warmly consulting a patient with confidence and calm assurance.",
                    voiceover="DoctorShield provides robust, continuous defence backed by seasoned medical malpractice attorneys, so you can practice with absolute clinical focus.",
                    onscreen_text="Practicing with Certainty • Tailored for Private Specialists"
                ),
                VideoScene(
                    scene_number=4,
                    duration_seconds=8,
                    visual_description="DoctorShield logo on deep slate blue background with authorized broker intermediary credentials.",
                    voiceover="Safeguard your medical practice. Discover the DoctorShield advantage today.",
                    onscreen_text="DoctorShield | Dedicated Medical Indemnity | Inquire Privately"
                )
            ]
        else: # jaguartransit
            concept = concept_notes or f"Zero-Risk Port Logistics & High-Value Cargo Protection"
            tone = "Commanding, secure, professional logistics precision"
            disclaimer = "Jaguar Transit provides cargo transit underwriting through licensed regional insurers."
            cta = "Contact Jaguar Transit Logistics Desk for bonded cargo transit quotes."
            scenes = [
                VideoScene(
                    scene_number=1,
                    duration_seconds=10,
                    visual_description="Time-lapse of container cranes at port with digital route tracking overlay displaying transit delay warnings.",
                    voiceover="Port congestion and unpredictable customs holds can disrupt fragile supply chains overnight. Who bears the cost if high-value cargo is compromised?",
                    onscreen_text="Port Delays Shouldn't Threaten Precious Freight."
                ),
                VideoScene(
                    scene_number=2,
                    duration_seconds=15,
                    visual_description="Armoured transport vehicle sealed with electronic GPS lock navigating airport cargo gates.",
                    voiceover="Standard freight contracts limit liability to pennies per kilo. Jaguar Transit provides full agreed-value door-to-door vault insurance.",
                    onscreen_text="Agreed-Value Vault Transit vs Warsaw/CMR Statutory Limits"
                ),
                VideoScene(
                    scene_number=3,
                    duration_seconds=12,
                    visual_description="Satellite GPS dashboard tracking live cargo shipment with green clearance status.",
                    voiceover="With active escort tracking and 24-hour claims settlement for delay-related loss, your cargo is never left unprotected.",
                    onscreen_text="24/7 Active GPS Tracking & Rapid Claims Dispatch"
                ),
                VideoScene(
                    scene_number=4,
                    duration_seconds=8,
                    visual_description="Bold metallic Jaguar Transit badge with secure transit shield.",
                    voiceover="Secure your regional shipments with Jaguar Transit. Contact our logistics underwriting desk.",
                    onscreen_text="Jaguar Transit | High-Value Valuables Cargo Insurance"
                )
            ]

        total_duration = sum(s.duration_seconds for s in scenes)

        return VideoScript(
            brand=brand_clean,
            concept=concept,
            target_duration_seconds=total_duration,
            voiceover_tone=tone,
            scenes=scenes,
            cta=cta,
            disclaimer=disclaimer,
            media_status="pending_render"
        )

media_service = MediaService()
