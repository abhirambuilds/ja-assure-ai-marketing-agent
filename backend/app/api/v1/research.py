from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.schemas.agent_contracts import ResearchInsight
from app.services.research_service import research_service

router = APIRouter(prefix="/research", tags=["Research & Intelligence"])

class ResearchRequest(BaseModel):
    brand: str = "jade"
    topic: str = "Jewellery & Watch Market Trends"
    competitor_url: Optional[str] = None

class ScrapeRequest(BaseModel):
    url: str

@router.post("/run", response_model=ResearchInsight)
async def run_research(req: ResearchRequest):
    """
    Run market and competitor research for a specific brand and topic.
    Extracts live insights and stores any detected competitors in the database.
    """
    try:
        insight = await research_service.conduct_research(
            brand=req.brand,
            topic=req.topic,
            competitor_url=req.competitor_url
        )
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research execution failed: {str(e)}")

@router.post("/scrape")
async def scrape_competitor_url(req: ScrapeRequest):
    """
    Directly scrape a competitor URL to extract metadata, headings, and copy.
    """
    try:
        result = await research_service.scrape_url(req.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")
