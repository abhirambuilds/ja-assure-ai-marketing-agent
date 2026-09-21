import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1.api import api_router
from app.database.session import engine
from app.models.entities import Base

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ja_assure.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe automatic table initialization on startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")

    # Surface which FFmpeg/ffprobe binaries this process will actually use, up
    # front, rather than only discovering a discovery problem on the first render.
    from app.services.ffmpeg_locator import resolve_ffmpeg, resolve_ffprobe, FFmpegNotFoundError
    try:
        resolve_ffmpeg()
        resolve_ffprobe()
    except FFmpegNotFoundError as e:
        logger.warning(f"Video generation will fail until this is resolved: {e}")

    yield
    logger.info("Shutting down JA Assure AI Marketing Agent backend.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic AI Marketing System for JA Assure (Jade, DoctorShield, Jaguar Transit)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve generated video/image assets (repo_root/media/generated/{job_id}/...).
# Phase 1: read-only static files, no auth -- fine for local/demo use; revisit if this
# is ever deployed somewhere public before Project 2 publishing work begins.
_MEDIA_ROOT = Path(__file__).resolve().parent.parent.parent / "media"
(_MEDIA_ROOT / "generated").mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(_MEDIA_ROOT)), name="media")

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "Welcome to JA Assure AI Marketing Agent API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "brands": settings.DEFAULT_BRANDS
    }
