import logging
from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc
from app.models.entities import Feedback, LessonLearned, ContentQueue
from app.database.session import SessionLocal

logger = logging.getLogger("ja_assure.lessons")

LESSON_CATEGORIES = [
    "too_salesy",
    "inaccurate_claim",
    "unsupported_claim",
    "false_guarantee",
    "missing_disclaimer",
    "off_brand",
    "wrong_cta",
    "poor_localization",
    "medical_advice",
    "pricing_claim",
    "competitor_comparison"
]

CATEGORY_LESSON_TEMPLATES = {
    "false_guarantee": "Never use absolute promises ('100% Guaranteed', 'Zero Risk', 'Never Denied'). All coverage must state 'Subject to policy underwriting criteria'.",
    "unsupported_claim": "Avoid claiming unlimited or all-loss coverage. Specify actual agreed-value policy limits and appraisal criteria.",
    "missing_disclaimer": "Always include standard intermediary disclaimer: '*Terms, conditions, and underwriting limits apply. JA Assure is a licensed insurance broker.*'",
    "medical_advice": "DoctorShield content must focus purely on malpractice liability defence and indemnity limits. NEVER offer medical diagnosis, treatments, or cure claims.",
    "pricing_claim": "Do not claim 'cheapest rates' or 'lowest premiums in the country'. Use 'competitive specialist rates' with underwriting review context.",
    "competitor_comparison": "Do not disparage or mention competitor insurance brands directly. Focus exclusively on JA Assure's strengths.",
    "too_salesy": "Adopt an educational, consultative tone tailored to high-net-worth collectors or medical specialists rather than aggressive promotional hype.",
    "poor_localization": "Verify that localized terminology conforms to local insurance authorities (e.g. BNM in Malaysia, OJK in Indonesia, OIC in Thailand).",
    "off_brand": "Adhere strictly to brand voice: Jade (luxury & expert), DoctorShield (clinical & empathetic), Jaguar Transit (secure & logistics authority)."
}

class LessonsService:
    """
    Closed-loop feedback and lessons learned engine.
    Ingests human review rejections/edits, tracks frequency, synthesizes generalized rules,
    and dynamically supplies active guidelines to the content generation pipeline.
    Uses Gemini structured reasoning when live, and falls back to category templates offline.
    """

    def record_feedback_and_synthesize(
        self,
        content_id: int,
        reason_tag: str,
        notes: str,
        original_content: str,
        corrected_content: Optional[str] = None
    ) -> LessonLearned:
        db = SessionLocal()
        try:
            # 1. Record Feedback Audit Log
            feedback = Feedback(
                content_id=content_id,
                reason_tag=reason_tag,
                notes=notes,
                original_content=original_content,
                corrected_content=corrected_content
            )
            db.add(feedback)

            # 2. Extract brand/platform context from content item
            content_item = db.get(ContentQueue, content_id)
            brand = content_item.brand if content_item else "general"
            platform = content_item.platform if content_item else "general"

            # 3. AI-Powered Lesson Synthesis (or Deterministic Fallback)
            synthesized_rule = self._synthesize_lesson_rule(
                brand=brand,
                platform=platform,
                reason_tag=reason_tag,
                notes=notes,
                original_content=original_content,
                corrected_content=corrected_content
            )

            # 4. Check if this reviewer-selected category already has an active lesson
            # NOTE: Reviewer-selected reason_tag is ALWAYS authoritative for category and frequency tracking.
            existing_lesson = db.execute(
                select(LessonLearned).where(LessonLearned.category == reason_tag)
            ).scalars().first()

            note_snippet = f"Reviewer: {notes}" if notes else "Correction logged"
            new_example = f"Original: {original_content[:100]}... | {note_snippet}"
            if corrected_content:
                new_example += f" | Fixed: {corrected_content[:100]}..."

            if existing_lesson:
                existing_lesson.frequency += 1
                # Update with latest synthesized rule for continuous improvement
                if synthesized_rule:
                    existing_lesson.lesson = synthesized_rule
                if new_example and new_example not in (existing_lesson.examples or ""):
                    existing_lesson.examples = f"{existing_lesson.examples or ''} || {new_example}"[:600]
                db.commit()
                db.refresh(existing_lesson)
                lesson_record = existing_lesson
                logger.info(f"Updated existing lesson [{reason_tag}] (Frequency {existing_lesson.frequency}x)")
            else:
                new_lesson = LessonLearned(
                    category=reason_tag, # Authoritative category from reviewer
                    lesson=synthesized_rule,
                    examples=new_example[:600],
                    frequency=1,
                    active=True
                )
                db.add(new_lesson)
                db.commit()
                db.refresh(new_lesson)
                lesson_record = new_lesson
                logger.info(f"Synthesized new active lesson [{reason_tag}]: {synthesized_rule}")

            return lesson_record
        except Exception as e:
            db.rollback()
            logger.error(f"Error recording feedback and lesson: {e}")
            raise e
        finally:
            db.close()

    def _synthesize_lesson_rule(
        self,
        brand: str,
        platform: str,
        reason_tag: str,
        notes: str,
        original_content: str,
        corrected_content: Optional[str] = None
    ) -> str:
        """
        Synthesizes a concise, reusable editorial rule using Gemini if available,
        falling back to category templates when offline.
        """
        # Fallback template definition
        fallback_rule = CATEGORY_LESSON_TEMPLATES.get(
            reason_tag,
            f"Adhere to human reviewer guidance: {notes}" if notes else f"Strictly avoid copy flagged under {reason_tag}."
        )

        from app.services.llm_provider import llm_provider
        if llm_provider.is_live:
            try:
                from app.schemas.agent_contracts import SynthesizedLesson
                correction_context = f"\nHuman Reviewer Corrected Text:\n\"{corrected_content}\"\n" if corrected_content else ""

                prompt = (
                    f"You are the Senior Editorial Governance & Compliance Director for JA Assure ({brand.title()}).\n"
                    f"A human reviewer has rejected or corrected a marketing post on {platform.upper()}.\n\n"
                    f"CONTEXT:\n"
                    f"- Brand: {brand.title()}\n"
                    f"- Platform: {platform}\n"
                    f"- Rejection Reason Category: {reason_tag}\n"
                    f"- Reviewer Notes & Guidance: {notes or 'Flagged during human review'}\n\n"
                    f"Original Flagged Copy:\n\"{original_content}\"\n"
                    f"{correction_context}\n"
                    f"TASK:\n"
                    f"Synthesize a concise, authoritative, reusable editorial rule (1-2 sentences) that future AI generation prompts will follow.\n"
                    f"RULES:\n"
                    f"1. Make it actionable, generalizable, and tone-appropriate for {brand.title()}.\n"
                    f"2. Never weaken insurance compliance, policy limits, or statutory disclaimers.\n"
                    f"3. Do not just repeat the specific copy; explain the principle to adhere to."
                )

                result: SynthesizedLesson = llm_provider.generate_structured(
                    prompt=prompt,
                    schema=SynthesizedLesson,
                    system_instruction="JA Assure Senior Compliance & Editorial Governance Editor."
                )

                if result and result.lesson_rule and len(result.lesson_rule.strip()) > 10:
                    logger.info(f"Gemini synthesized lesson for [{reason_tag}]: {result.lesson_rule}")
                    return result.lesson_rule.strip()
            except Exception as e:
                logger.warning(f"Gemini lesson synthesis failed: {e}. Using template fallback.")

        # Deterministic fallback
        if notes and len(notes.strip()) > 10:
            # Combine template and specific note for rich offline feedback
            return f"{fallback_rule} Note: {notes.strip()}"
        return fallback_rule

    def get_relevant_lessons_for_prompt(self, brand: str, platform: Optional[str] = None) -> List[str]:
        """
        Dynamically retrieve active lessons from database to inject into AI generation prompts.
        """
        db = SessionLocal()
        try:
            lessons = db.execute(
                select(LessonLearned)
                .where(LessonLearned.active == True)
                .order_by(desc(LessonLearned.frequency))
                .limit(5)
            ).scalars().all()

            guidelines: List[str] = []
            for l in lessons:
                guidelines.append(f"[{l.category.upper()} - Priority {l.frequency}x]: {l.lesson}")

            # Always add brand-specific baseline rule
            brand_clean = brand.lower()
            if brand_clean == "doctorshield":
                guidelines.append("[REGULATORY]: Never offer clinical medical advice or diagnosis. Confine copy strictly to legal defence counsel and indemnity.")
            elif brand_clean == "jade":
                guidelines.append("[BRAND VOICE]: Convey luxury, collector prestige, and agreed-value appraisal precision.")
            elif brand_clean == "jaguartransit":
                guidelines.append("[SECURITY]: Emphasize door-to-door vault transit integrity and active GPS monitoring.")

            return guidelines
        finally:
            db.close()

lessons_service = LessonsService()
