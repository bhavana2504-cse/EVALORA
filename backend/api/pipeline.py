from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from utils.llm import LLMProvider

router = APIRouter(tags=["Pipeline"])
llm = LLMProvider()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PipelineRequest(BaseModel):
    resume_text: str
    job_description: str
    agent1_output: Optional[Dict[str, Any]] = None
    agent2_output: Optional[Dict[str, Any]] = None
    agent3_output: Optional[Dict[str, Any]] = None

@router.post("/pipeline/agent1")
async def run_agent1(req: PipelineRequest):
    try:
        logger.info("[Agent 1] Requesting Gemini...")
        result = llm.run_agent_1_resume_analyst(req.resume_text, req.job_description)
        logger.info("[Agent 1] Received Gemini Response")
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"[Agent 1] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/agent2")
async def run_agent2(req: PipelineRequest):
    if not req.agent1_output:
        raise HTTPException(status_code=400, detail="agent1_output is required")
    try:
        logger.info("[Agent 2] Requesting Gemini...")
        result = llm.run_agent_2_technical_evaluator(req.resume_text, req.job_description, req.agent1_output)
        logger.info("[Agent 2] Received Gemini Response")
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"[Agent 2] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/agent3")
async def run_agent3(req: PipelineRequest):
    if not req.agent1_output or not req.agent2_output:
        raise HTTPException(status_code=400, detail="agent1_output and agent2_output are required")
    try:
        logger.info("[Agent 3] Requesting Gemini...")
        result = llm.run_agent_3_challenger(req.resume_text, req.job_description, req.agent1_output, req.agent2_output)
        logger.info("[Agent 3] Received Gemini Response")
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"[Agent 3] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/agent4")
async def run_agent4(req: PipelineRequest):
    if not req.agent1_output or not req.agent2_output or not req.agent3_output:
        raise HTTPException(status_code=400, detail="Outputs from agents 1, 2, and 3 are required")
    try:
        logger.info("[Agent 4] Requesting Gemini...")
        result = llm.run_agent_4_hiring_judge(req.resume_text, req.job_description, req.agent1_output, req.agent2_output, req.agent3_output)
        logger.info("[Agent 4] Received Gemini Response")
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"[Agent 4] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
