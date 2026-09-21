import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

# Mount local media directory for persistent audio/video assets
from pathlib import Path
from fastapi.staticfiles import StaticFiles

media_dir = Path(__file__).resolve().parent.parent / "media"
media_dir.mkdir(parents=True, exist_ok=True)
(media_dir / "voiceovers").mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "Welcome to JA Assure AI Marketing Agent API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "brands": settings.DEFAULT_BRANDS
    }
