from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from app.agents.research.agent import ResearchAgent
from app.agents.content.agent import ContentAgent
from app.agents.compliance.agent import ComplianceAgent
from app.agents.leads.agent import LeadAgent
from app.agents.feedback.agent import FeedbackAgent
from app.agents.localization.agent import LocalizationAgent
from app.agents.media.agent import MediaAgent
from app.agents.publishing.agent import PublishingAgent

router = APIRouter(prefix="/agents", tags=["Agent Execution"])

agents_registry = {
    "research": ResearchAgent(),
    "content": ContentAgent(),
    "compliance": ComplianceAgent(),
    "leads": LeadAgent(),
    "feedback": FeedbackAgent(),
    "localization": LocalizationAgent(),
    "media": MediaAgent(),
    "publishing": PublishingAgent(),
}

@router.get("/list")
def list_available_agents():
    return {
        "agents": list(agents_registry.keys()),
        "description": "Registered modular marketing agents ready for task execution"
    }

@router.post("/run/{agent_name}")
async def run_agent(agent_name: str, payload: Dict[str, Any]):
    agent = agents_registry.get(agent_name.lower())
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_name}' not found. Available: {list(agents_registry.keys())}"
        )
    try:
        result = await agent.run(payload)
        return {
            "agent": agent_name,
            "status": "success",
            "output": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")
