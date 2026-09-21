from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.agent_contracts import (
    ContentBrief,
    GeneratedVariation,
    ContentSuiteRequest,
    VideoScript,
    VoiceGenerationResult,
)
from app.schemas.dtos import ContentQueueResponse
from app.services.content_service import content_service
from app.services.media_service import media_service
from app.services.pipeline_service import pipeline_service
from app.services.voice_service import (
    voice_service,
    VoiceEmptyError,
    VoiceLanguageError,
    VoiceSynthesisError
)

router = APIRouter(prefix="/content", tags=["Content Generation"])

class SingleContentRequest(BaseModel):
    brand: str
    platform: str
    topic: str
    content_type: str = "post"
    language: str = "en"
    key_benefits: Optional[List[str]] = None
    target_persona: Optional[str] = None
    cta: Optional[str] = None

class VideoRequest(BaseModel):
    brand: str = "jade"
    topic: str = "Protecting bespoke jewellery collections"
    target_duration: int = 45
    platform: Optional[str] = "reel"
    language: Optional[str] = "en"
    target_audience: Optional[str] = None

@router.post("/generate", response_model=List[GeneratedVariation])
async def generate_content_variations(req: SingleContentRequest):
    """
    Generate A/B marketing copy variations for a single brief adhering to brand voice & active lessons.
    """
    brief = ContentBrief(
        brand=req.brand,
        platform=req.platform,
        content_type=req.content_type,
        topic=req.topic,
        language=req.language,
        key_benefits=req.key_benefits or [],
        target_persona=req.target_persona,
        cta=req.cta
    )
    try:
        variations = await content_service.generate_variations(brief)
        return variations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

@router.post("/suite", response_model=List[ContentQueueResponse])
async def generate_content_suite(suite_req: ContentSuiteRequest):
    """
    Execute full 'Brain' pipeline across multiple platforms, formats, and languages.
    Automatically applies research context, injects lessons, runs compliance gate,
    and stages items in ContentQueue with status='human_review' (MANDATORY human sign-off).
    """
    try:
        created_items = await pipeline_service.generate_content_suite(suite_req)
        return created_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content suite pipeline failed: {str(e)}")

@router.post("/video", response_model=VideoScript)
async def generate_video_script(req: VideoRequest):
    """
    Generate a 30-60 second structured video storyboard with scene breakdowns and voiceover.
    """
    try:
        script = await media_service.generate_video_script(
            brand=req.brand,
            topic=req.topic,
            target_duration=req.target_duration,
            platform=req.platform or "reel",
            language=req.language or "en",
            target_audience=req.target_audience
        )
        return script
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video script generation failed: {str(e)}")

@router.post("/voice", response_model=VoiceGenerationResult)
async def generate_voiceover(
    script: VideoScript,
    language_override: Optional[str] = None
):
    """
    Synthesize high-fidelity MP3 speech audio from VideoScript scene voiceover text.
    Uses dedicated VoiceService with clean multi-language mapping (en, ms, id, th, zh).
    Saves persistent MP3 to /media/voiceovers/ and returns audio URL and duration.
    """
    try:
        result = voice_service.synthesize_from_script(
            script=script,
            language_override=language_override
        )
        return result
    except VoiceEmptyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except VoiceLanguageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except VoiceSynthesisError as e:
        raise HTTPException(status_code=502, detail=f"Voice synthesis failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice generation failed: {str(e)}")
