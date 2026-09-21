"""
Deterministic validation for a Groq-generated VideoScript before any image/FFmpeg
work is spent on it. No LLM involved -- pure Python checks, cheap to run first.
"""
from dataclasses import dataclass, field
from typing import List
from app.schemas.agent_contracts import VideoScript

MIN_SCENES = 1
MAX_SCENES = 6
MIN_TOTAL_DURATION_SECONDS = 5
MAX_TOTAL_DURATION_SECONDS = 120


@dataclass
class ValidationResult:
    valid: bool
    errors: List[str] = field(default_factory=list)


def validate_video_script(script: VideoScript) -> ValidationResult:
    errors: List[str] = []

    if not script.title or not script.title.strip():
        errors.append("title is missing or empty")
    if not script.brand or not script.brand.strip():
        errors.append("brand is missing or empty")
    if not script.target_platform or not script.target_platform.strip():
        errors.append("target_platform is missing or empty")
    if not script.disclaimer or not script.disclaimer.strip():
        errors.append("disclaimer is missing or empty")

    if not script.scenes:
        errors.append("scenes list is empty")
        return ValidationResult(valid=False, errors=errors)

    scene_count = len(script.scenes)
    if scene_count < MIN_SCENES or scene_count > MAX_SCENES:
        errors.append(f"scene count {scene_count} is outside the allowed range [{MIN_SCENES}, {MAX_SCENES}]")

    seen_numbers = set()
    total_duration = 0
    for idx, scene in enumerate(script.scenes, start=1):
        label = f"scene #{idx} (scene_number={getattr(scene, 'scene_number', '?')})"

        scene_number = getattr(scene, "scene_number", None)
        if scene_number is None:
            errors.append(f"{label}: missing scene_number")
        elif scene_number in seen_numbers:
            errors.append(f"{label}: duplicate scene_number")
        else:
            seen_numbers.add(scene_number)

        if not getattr(scene, "visual_description", None) or not scene.visual_description.strip():
            errors.append(f"{label}: visual_description is missing or empty")
        if not getattr(scene, "voiceover", None) or not scene.voiceover.strip():
            errors.append(f"{label}: voiceover is missing or empty")
        if not getattr(scene, "onscreen_text", None) or not scene.onscreen_text.strip():
            errors.append(f"{label}: onscreen_text is missing or empty")

        duration = getattr(scene, "duration_seconds", None)
        if duration is None or duration <= 0:
            errors.append(f"{label}: duration_seconds must be positive, got {duration}")
        else:
            total_duration += duration

    if total_duration and not (MIN_TOTAL_DURATION_SECONDS <= total_duration <= MAX_TOTAL_DURATION_SECONDS):
        errors.append(
            f"total scene duration {total_duration}s is outside the reasonable range "
            f"[{MIN_TOTAL_DURATION_SECONDS}, {MAX_TOTAL_DURATION_SECONDS}]s"
        )

    return ValidationResult(valid=len(errors) == 0, errors=errors)
