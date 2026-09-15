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
            # 1. Record Feedback
            feedback = Feedback(
                content_id=content_id,
                reason_tag=reason_tag,
                notes=notes,
                original_content=original_content,
                corrected_content=corrected_content
            )
            db.add(feedback)

            # 2. Check if this reason tag already has an active lesson
            existing_lesson = db.execute(
                select(LessonLearned).where(LessonLearned.category == reason_tag)
            ).scalars().first()

            if existing_lesson:
                existing_lesson.frequency += 1
                if notes and notes not in (existing_lesson.examples or ""):
                    existing_lesson.examples = f"{existing_lesson.examples or ''} | Note: {notes}"[:500]
                db.commit()
                db.refresh(existing_lesson)
                lesson_record = existing_lesson
            else:
                synthesized_text = CATEGORY_LESSON_TEMPLATES.get(
                    reason_tag,
                    f"Guideline from human reviewer: {notes}"
                )
                new_lesson = LessonLearned(
                    category=reason_tag,
                    lesson=synthesized_text,
                    examples=f"Original flagged excerpt: {original_content[:120]}... Reviewer note: {notes}",
                    frequency=1,
                    active=True
                )
                db.add(new_lesson)
                db.commit()
                db.refresh(new_lesson)
                lesson_record = new_lesson

            return lesson_record
        except Exception as e:
            db.rollback()
            logger.error(f"Error recording feedback and lesson: {e}")
            raise e
        finally:
            db.close()

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
