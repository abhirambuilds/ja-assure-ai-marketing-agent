from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.schemas.agent_contracts import ResearchInsight, ResearchFinding
from app.services.research_service import research_service

router = APIRouter(prefix="/research", tags=["Research & Intelligence"])

class ResearchRequest(BaseModel):
    brand: str = "jade"
    topic: str = "Jewellery & Watch Market Trends"
    competitor_url: Optional[str] = None
    country: Optional[str] = None

class ScrapeRequest(BaseModel):
    url: str

class AnalyzeRequest(BaseModel):
    url: str
    brand: Optional[str] = "jade"

@router.post("/run", response_model=ResearchInsight)
async def run_research(req: ResearchRequest):
    """
    Run market and competitor research for a specific brand, topic, and jurisdiction.
    Extracts live insights, performs Gemini analysis, and stores any detected competitors in SQLite.
    """
    try:
        insight = await research_service.conduct_research(
            brand=req.brand,
            topic=req.topic,
            competitor_url=req.competitor_url,
            country=req.country
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

@router.post("/analyze", response_model=ResearchFinding)
async def analyze_competitor_url(req: AnalyzeRequest):
    """
    Scrapes a competitor page, executes Gemini structured intelligence analysis,
    extracts positioning, claims, offerings, and counter-positioning whitespace,
    and upserts the record into the Competitor database.
    """
    try:
        scraped_data = await research_service.scrape_url(req.url)
        if scraped_data.get("status") != "success":
            raise HTTPException(
                status_code=400,
                detail=f"Could not scrape URL: {scraped_data.get('summary', 'Network error')}"
            )
        
        finding = await research_service.analyze_scraped_content(scraped_data, brand=req.brand)
        research_service._save_or_update_competitor(req.brand or "jade", req.url, finding)
        return finding
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor analysis failed: {str(e)}")
