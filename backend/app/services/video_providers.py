"""
Visual asset generation for video scenes.

VideoProvider is the interface every scene-visual generator implements. Each
concrete provider produces ONE STILL IMAGE per scene (the FFmpeg assembly step in
video_generation_service.py is what adds camera motion). A future ComfyUIWanProvider
(native video-clip generation, not stills) could implement the same interface --
video_generation_service.py only needs a valid image file path back, never cares how
the pixels were produced.

Concrete providers:
  - OpenAIImageProvider: OpenAI Images API (unchanged from Phase 1). On failure,
    gracefully degrades to BrandedFallbackProvider -- this existing behavior is
    preserved exactly as-is.
  - HuggingFaceImageProvider: Hugging Face Inference Providers via huggingface_hub's
    InferenceClient (new). On failure, raises explicitly -- it never pretends a
    branded card is an AI-generated result.
  - BrandedFallbackProvider: deterministic, clearly-labeled placeholder card. Used
    automatically by OpenAIImageProvider on failure/no-credential, and available as
    an explicitly-selected provider (IMAGE_PROVIDER=branded_fallback) for fast,
    credential-free testing/demos.

ImageMotionProvider is a thin provider-SELECTOR: it's what video_generation_service.py
actually instantiates (unchanged call site), and it picks the concrete provider above
based on settings.IMAGE_PROVIDER. This is what let the video pipeline itself require
zero changes to gain a second real AI image vendor.
"""
import base64
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional

import httpx
from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.schemas.agent_contracts import VideoScene

logger = logging.getLogger("ja_assure.video.providers")

FALLBACK_CANVAS_SIZE = (1080, 1920)

SOURCE_AI_GENERATED = "ai_generated_openai"
SOURCE_HUGGINGFACE = "huggingface"
SOURCE_FALLBACK = "branded_fallback_demo"

# Per-brand visual style, layered onto scene.visual_description for image prompts.
# Deliberately excludes the scene's voiceover text -- that's narration copy, not a
# visual instruction, and stuffing it into the prompt produces worse, more literal
# (and sometimes text-in-image) results from diffusion/photo models.
_BRAND_VISUAL_STYLE = {
    "jade": "luxury editorial photography, warm gold and deep emerald tones, quiet opulence, shallow depth of field",
    "doctorshield": "clean clinical editorial photography, calm and trustworthy, soft blue and white palette",
    "jaguartransit": "cinematic industrial photography, secure and commanding, dark amber and steel tones",
}


class ImageGenerationError(Exception):
    """Raised by a provider when it fails and must NOT be silently treated as success."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def build_scene_image_prompt(scene: VideoScene, brand: str) -> str:
    """
    Combines the scene's visual description with brand style, vertical composition,
    and photography direction -- NOT the scene's full voiceover.
    """
    style = _BRAND_VISUAL_STYLE.get(brand, "cinematic editorial photography, professional and polished")
    return (
        f"{scene.visual_description}. "
        f"{style}, vertical 9:16 composition, photorealistic, high-end commercial "
        f"photography, no on-image text, no watermarks, no logos."
    )


class SceneVisualResult:
    def __init__(self, path: Path, source: str):
        self.path = path
        self.source = source  # SOURCE_AI_GENERATED | SOURCE_HUGGINGFACE | SOURCE_FALLBACK


class VideoProvider(ABC):
    """Interface every scene-visual generator (real or future) must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    async def generate_scene_visual(self, scene: VideoScene, brand: str, output_path: Path) -> SceneVisualResult:
        """Write a still image to output_path and return where it came from."""
        ...


class BrandedFallbackProvider(VideoProvider):
    """
    Deterministic, clearly-labeled placeholder card -- explicitly NOT AI-generated.
    Used automatically when OpenAIImageProvider has no credential or fails, and
    available as an explicit, credential-free provider choice
    (IMAGE_PROVIDER=branded_fallback) for fast testing/demos.
    """

    @property
    def name(self) -> str:
        return "branded_fallback"

    async def generate_scene_visual(self, scene: VideoScene, brand: str, output_path: Path) -> SceneVisualResult:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        self._generate_fallback_card(scene, brand, output_path)
        return SceneVisualResult(path=output_path, source=SOURCE_FALLBACK)

    def _generate_fallback_card(self, scene: VideoScene, brand: str, output_path: Path) -> None:
        from app.services.content_service import BRAND_PERSONAS

        persona = BRAND_PERSONAS.get(brand, BRAND_PERSONAS["jade"])
        brand_colors = {
            "jade": (10, 40, 34),
            "doctorshield": (10, 26, 46),
            "jaguartransit": (36, 20, 10),
        }
        bg = brand_colors.get(brand, (20, 20, 20))

        w, h = FALLBACK_CANVAS_SIZE
        img = Image.new("RGB", (w, h), color=bg)
        draw = ImageDraw.Draw(img)

        title_font, body_font, label_font = self._load_fonts()

        draw.text((60, int(h * 0.08)), persona["title"].upper(), font=title_font, fill=(230, 200, 120))
        draw.text((60, int(h * 0.18)), f"Scene {scene.scene_number}", font=body_font, fill=(255, 255, 255))

        wrapped = self._wrap_text(scene.visual_description, body_font, w - 120)
        y = int(h * 0.35)
        for line in wrapped:
            draw.text((60, y), line, font=body_font, fill=(220, 220, 220))
            y += 44

        label = "FALLBACK VISUAL -- NOT AI-GENERATED (DEMO MODE)"
        draw.rectangle([(0, h - 90), (w, h)], fill=(120, 20, 20))
        draw.text((30, h - 68), label, font=label_font, fill=(255, 255, 255))

        img.save(output_path, "PNG")

    @staticmethod
    def _load_fonts():
        try:
            title_font = ImageFont.truetype("arial.ttf", 54)
            body_font = ImageFont.truetype("arial.ttf", 36)
            label_font = ImageFont.truetype("arial.ttf", 28)
        except Exception:
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
            label_font = ImageFont.load_default()
        return title_font, body_font, label_font

    @staticmethod
    def _wrap_text(text: str, font: "ImageFont.ImageFont", max_width: int) -> List[str]:
        words = text.split()
        lines: List[str] = []
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            bbox = font.getbbox(trial)
            if bbox[2] - bbox[0] > max_width and current:
                lines.append(current)
                current = word
            else:
                current = trial
        if current:
            lines.append(current)
        return lines[:8]


class OpenAIImageProvider(VideoProvider):
    """
    Real AI image generation via OpenAI's Images API. Unchanged from Phase 1: on
    missing credential, network error, timeout, or non-2xx response, gracefully
    degrades to BrandedFallbackProvider -- never presented as AI-generated.
    """

    @property
    def name(self) -> str:
        return "openai_image"

    @property
    def is_configured(self) -> bool:
        return bool(settings.OPENAI_API_KEY)

    async def generate_scene_visual(self, scene: VideoScene, brand: str, output_path: Path) -> SceneVisualResult:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if self.is_configured:
            try:
                await self._generate_ai_image(scene, brand, output_path)
                return SceneVisualResult(path=output_path, source=SOURCE_AI_GENERATED)
            except Exception as e:
                logger.warning(
                    f"OpenAI image generation failed for scene {scene.scene_number}: {e}. "
                    f"Using branded fallback card instead."
                )
        else:
            logger.info(
                f"No OPENAI_API_KEY configured; scene {scene.scene_number} will use the "
                f"branded fallback card (demo mode), not a real AI-generated image."
            )

        return await BrandedFallbackProvider().generate_scene_visual(scene, brand, output_path)

    async def _generate_ai_image(self, scene: VideoScene, brand: str, output_path: Path) -> None:
        prompt = build_scene_image_prompt(scene, brand)
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-image-1",
                    "prompt": prompt,
                    "size": "1024x1536",
                    "n": 1,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            b64 = data["data"][0]["b64_json"]
            output_path.write_bytes(base64.b64decode(b64))


class HuggingFaceImageProvider(VideoProvider):
    """
    Real AI image generation via Hugging Face Inference Providers
    (huggingface_hub.InferenceClient.text_to_image). Unlike OpenAIImageProvider, this
    provider does NOT silently degrade to the branded card on failure -- it raises
    ImageGenerationError explicitly, per the requirement that a Hugging Face failure
    must never be reported as a successful AI-generated result.
    """

    DEFAULT_MODEL = "black-forest-labs/FLUX.1-dev"

    @property
    def name(self) -> str:
        return "huggingface_image"

    @property
    def is_configured(self) -> bool:
        return bool(settings.HF_TOKEN)

    @property
    def model(self) -> str:
        return settings.HF_IMAGE_MODEL or self.DEFAULT_MODEL

    async def generate_scene_visual(self, scene: VideoScene, brand: str, output_path: Path) -> SceneVisualResult:
        if not self.is_configured:
            raise ImageGenerationError(
                "HF_TOKEN is not configured. Set it in backend/.env to use the Hugging Face image provider."
            )

        output_path.parent.mkdir(parents=True, exist_ok=True)
        prompt = build_scene_image_prompt(scene, brand)

        try:
            import asyncio
            image = await asyncio.to_thread(self._call_inference_client, prompt)
            image.save(output_path)
        except ImageGenerationError:
            raise
        except Exception as e:
            raise ImageGenerationError(f"Hugging Face image generation failed (model={self.model}): {e}")

        if not output_path.exists() or output_path.stat().st_size == 0:
            raise ImageGenerationError("Hugging Face image generation produced an empty file.")

        return SceneVisualResult(path=output_path, source=SOURCE_HUGGINGFACE)

    def _call_inference_client(self, prompt: str) -> "Image.Image":
        # Imported lazily so the rest of this module (OpenAI/branded providers) never
        # depends on huggingface_hub being installed unless this provider is actually used.
        try:
            from huggingface_hub import InferenceClient
        except ImportError as e:
            raise ImageGenerationError(
                "huggingface_hub is not installed. Run `pip install -r requirements.txt`."
            ) from e

        client = InferenceClient(token=settings.HF_TOKEN)
        return client.text_to_image(prompt, model=self.model)


class ImageMotionProvider(VideoProvider):
    """
    Provider SELECTOR -- this is what video_generation_service.py instantiates
    (unchanged call site: `ImageMotionProvider()` -> `generate_scene_visual(...)`).
    Picks the concrete provider based on settings.IMAGE_PROVIDER so the video
    pipeline itself required zero changes to support a second real AI image vendor.
    """

    def __init__(self):
        self._delegate = self._select_provider()

    @property
    def name(self) -> str:
        return self._delegate.name

    @staticmethod
    def _select_provider() -> VideoProvider:
        choice = (settings.IMAGE_PROVIDER or "openai").strip().lower()
        if choice == "huggingface":
            return HuggingFaceImageProvider()
        if choice == "branded_fallback":
            return BrandedFallbackProvider()
        return OpenAIImageProvider()

    async def generate_scene_visual(self, scene: VideoScene, brand: str, output_path: Path) -> SceneVisualResult:
        return await self._delegate.generate_scene_visual(scene, brand, output_path)
