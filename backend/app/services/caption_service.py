"""
Deterministic SRT caption generation and validation for narrated video scenes.

Captions are derived directly from the exact scene voiceover text already present in
the structured VideoScript -- no speech-to-text, no separate transcription dependency.
Timestamps come from each scene's MEASURED audio duration (never the originally
planned scene duration), so a caption can never claim to run longer than the audio
that actually plays under it. One cue per scene is sufficient for this MVP.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class CaptionCue:
    index: int
    start_ms: int
    end_ms: int
    text: str


@dataclass
class SRTValidationResult:
    valid: bool
    errors: List[str] = field(default_factory=list)


def _format_srt_timestamp(ms: int) -> str:
    ms = max(0, int(ms))
    hours, rem = divmod(ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    seconds, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def build_scene_cues(scene_texts_and_durations: List[Tuple[str, float]]) -> List[CaptionCue]:
    """
    scene_texts_and_durations: [(voiceover_text, measured_audio_duration_seconds), ...]
    in scene order. Produces one cue per scene at a cumulative offset across the
    whole video's timeline -- this is the "global" caption track (captions.srt).
    """
    cues: List[CaptionCue] = []
    cursor_ms = 0
    for idx, (text, duration_seconds) in enumerate(scene_texts_and_durations, start=1):
        duration_ms = max(1, int(round(duration_seconds * 1000)))
        end_ms = cursor_ms + duration_ms
        cues.append(CaptionCue(index=idx, start_ms=cursor_ms, end_ms=end_ms, text=text.strip()))
        cursor_ms = end_ms
    return cues


def build_local_cue(text: str, duration_seconds: float) -> CaptionCue:
    """
    A single cue re-based to 0, spanning exactly one scene's own clip. Used when
    burning captions into that scene's individual FFmpeg render, before concatenation.
    """
    duration_ms = max(1, int(round(duration_seconds * 1000)))
    return CaptionCue(index=1, start_ms=0, end_ms=duration_ms, text=text.strip())


def render_srt(cues: List[CaptionCue]) -> str:
    blocks = []
    for cue in cues:
        blocks.append(
            f"{cue.index}\n"
            f"{_format_srt_timestamp(cue.start_ms)} --> {_format_srt_timestamp(cue.end_ms)}\n"
            f"{cue.text}\n"
        )
    return "\n".join(blocks) + "\n"


def validate_srt(cues: List[CaptionCue], total_duration_seconds: Optional[float] = None) -> SRTValidationResult:
    errors: List[str] = []
    if not cues:
        errors.append("no caption cues generated")
        return SRTValidationResult(valid=False, errors=errors)

    prev_end = -1
    for cue in cues:
        if not cue.text:
            errors.append(f"cue {cue.index}: empty text")
        if cue.start_ms < 0 or cue.end_ms < 0:
            errors.append(f"cue {cue.index}: negative timestamp")
        if cue.end_ms <= cue.start_ms:
            errors.append(f"cue {cue.index}: end ({cue.end_ms}ms) must be after start ({cue.start_ms}ms)")
        if cue.start_ms < prev_end:
            errors.append(f"cue {cue.index}: overlaps previous cue (start {cue.start_ms}ms < prior end {prev_end}ms)")
        prev_end = cue.end_ms

    if total_duration_seconds is not None:
        # small rounding tolerance -- measured durations and cumulative sums can be off by a few ms
        total_ms = int(round(total_duration_seconds * 1000)) + 50
        if cues[-1].end_ms > total_ms:
            errors.append(
                f"final cue ends at {cues[-1].end_ms}ms, which exceeds the total audio duration ({total_ms}ms)"
            )

    return SRTValidationResult(valid=len(errors) == 0, errors=errors)
