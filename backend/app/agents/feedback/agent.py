from typing import Any, Dict
from app.agents.base import BaseAgent
from app.schemas.agent_contracts import LessonLearned
from app.services.llm_provider import llm_provider

class FeedbackAgent(BaseAgent):
    """
    Agent responsible for ingesting human rejection/edits, distilling systemic lessons learned,
    and categorizing them for future generation cycles.
    """
    def __init__(self):
        super().__init__(name="feedback_agent")

    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        content_id = inputs.get("content_id", 0)
        reason_tag = inputs.get("reason_tag", "unspecified")
        notes = inputs.get("notes", "")
        original = inputs.get("original_content", "")
        corrected = inputs.get("corrected_content", "")

        self.log_event("process_feedback", {"reason_tag": reason_tag, "content_id": content_id})

        from app.services.lessons_service import lessons_service
        lesson = lessons_service.record_feedback_and_synthesize(
            content_id=content_id,
            reason_tag=reason_tag,
            notes=notes,
            original_content=original,
            corrected_content=corrected
        )

        return {
            "status": "success",
            "lesson_id": lesson.id,
            "category": lesson.category,
            "lesson": lesson.lesson,
            "frequency": lesson.frequency
        }
