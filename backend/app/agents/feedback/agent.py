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
        reason_tag = inputs.get("reason_tag", "unspecified")
        notes = inputs.get("notes", "")
        original = inputs.get("original_content", "")
        corrected = inputs.get("corrected_content", "")

        self.log_event("process_feedback", {"reason_tag": reason_tag})

        prompt = (
            f"Extract a generalized 'Lesson Learned' guideline from this human review intervention:\n"
            f"Tag: {reason_tag}\n"
            f"Reviewer Notes: {notes}\n"
            f"Original Copy: {original}\n"
            f"Human Corrected Copy: {corrected}\n\n"
            f"Synthesize an actionable rule that future AI generation prompts should adhere to."
        )
        system_prompt = "You are a machine learning feedback engineer extracting behavioral rules from human feedback."

        lesson: LessonLearned = llm_provider.generate_structured(
            prompt=prompt,
            schema=LessonLearned,
            system_instruction=system_prompt
        )

        return lesson.model_dump()
