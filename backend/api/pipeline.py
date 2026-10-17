import json
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import CandidateProfile, Evaluation
from utils.llm import LLMProvider

router = APIRouter(tags=["Pipeline"])
llm = LLMProvider()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PipelineRequest(BaseModel):
    resume_text: str
    job_description: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
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
async def run_agent4(req: PipelineRequest, db: Session = Depends(get_db)):
    if not req.agent1_output or not req.agent2_output or not req.agent3_output:
        raise HTTPException(status_code=400, detail="Outputs from agents 1, 2, and 3 are required")
    try:
        logger.info("[Agent 4] Requesting Gemini...")
        result = llm.run_agent_4_hiring_judge(req.resume_text, req.job_description, req.agent1_output, req.agent2_output, req.agent3_output)
        logger.info("[Agent 4] Received Gemini Response")

        # Save evaluation to database
        cid = req.candidate_id or f"cand_{uuid.uuid4().hex[:8]}"
        candidate_name = req.candidate_name or "Candidate"

        # Ensure candidate profile exists
        profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == cid).first()
        if not profile:
            profile = CandidateProfile(
                candidate_id=cid,
                name=candidate_name,
                education="Extracted via pipeline",
                experience="Extracted via pipeline",
                skills=", ".join([s.get("skill", "") for s in req.agent1_output.get("scores", []) if isinstance(s, dict)])
            )
            db.add(profile)
            db.commit()

        # Extract technical questions from agent2 if available
        questions = req.agent2_output.get("questions", [])

        eval_record = Evaluation(
            candidate_id=cid,
            job_description=req.job_description[:2000],
            overall_score=result.get("overall_score", 75),
            final_recommendation=result.get("final_recommendation", "Consider"),
            confidence=result.get("confidence", 80),
            category_scores=json.dumps(result.get("category_scores", {})),
            strengths=json.dumps(result.get("strengths", [])),
            concerns=json.dumps(result.get("concerns", [])),
            evidence_ids=json.dumps(result.get("evidence", [])),
            panel_debate=result.get("panel_debate", ""),
            technical_questions=json.dumps(questions),
            agent_outputs=json.dumps({
                "agent1": req.agent1_output,
                "agent2": req.agent2_output,
                "agent3": req.agent3_output,
                "agent4": result
            })
        )
        db.add(eval_record)
        db.commit()

        return {
            "status": "success", 
            "data": result,
            "candidate_id": cid,
            "evaluation_id": eval_record.id
        }
    except Exception as e:
        db.rollback()
        logger.error(f"[Agent 4] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pipeline/full")
async def run_full_pipeline(req: PipelineRequest, db: Session = Depends(get_db)):
    """Runs all 4 agents sequentially in one call."""
    try:
        # Step 1
        agent1 = llm.run_agent_1_resume_analyst(req.resume_text, req.job_description)
        # Step 2
        agent2 = llm.run_agent_2_technical_evaluator(req.resume_text, req.job_description, agent1)
        # Step 3
        agent3 = llm.run_agent_3_challenger(req.resume_text, req.job_description, agent1, agent2)
        # Step 4
        agent4 = llm.run_agent_4_hiring_judge(req.resume_text, req.job_description, agent1, agent2, agent3)

        cid = req.candidate_id or f"cand_{uuid.uuid4().hex[:8]}"
        candidate_name = req.candidate_name or "Candidate"

        profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == cid).first()
        if not profile:
            profile = CandidateProfile(
                candidate_id=cid,
                name=candidate_name,
                education="Extracted via pipeline",
                experience="Extracted via pipeline",
                skills=""
            )
            db.add(profile)
            db.commit()

        eval_record = Evaluation(
            candidate_id=cid,
            job_description=req.job_description[:2000],
            overall_score=agent4.get("overall_score", 75),
            final_recommendation=agent4.get("final_recommendation", "Consider"),
            confidence=agent4.get("confidence", 80),
            category_scores=json.dumps(agent4.get("category_scores", {})),
            strengths=json.dumps(agent4.get("strengths", [])),
            concerns=json.dumps(agent4.get("concerns", [])),
            evidence_ids=json.dumps(agent4.get("evidence", [])),
            panel_debate=agent4.get("panel_debate", ""),
            technical_questions=json.dumps(agent2.get("questions", [])),
            agent_outputs=json.dumps({
                "agent1": agent1,
                "agent2": agent2,
                "agent3": agent3,
                "agent4": agent4
            })
        )
        db.add(eval_record)
        db.commit()

        return {
            "status": "success",
            "candidate_id": cid,
            "evaluation_id": eval_record.id,
            "agent1": agent1,
            "agent2": agent2,
            "agent3": agent3,
            "agent4": agent4
        }
    except Exception as e:
        db.rollback()
        logger.error(f"[Pipeline Full] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class CandidateBatchItem(BaseModel):
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    filename: Optional[str] = None
    resume_text: str

class BatchPipelineRequest(BaseModel):
    job_description: str
    candidates: list[CandidateBatchItem]

@router.post("/pipeline/batch")
async def run_batch_pipeline(req: BatchPipelineRequest, db: Session = Depends(get_db)):
    """Runs the 4-agent evaluation for all candidates in the batch."""
    if not req.candidates:
        raise HTTPException(status_code=400, detail="No candidates provided for batch evaluation.")

    evaluations = []
    for cand in req.candidates:
        try:
            # Step 1
            a1 = llm.run_agent_1_resume_analyst(cand.resume_text, req.job_description)
            # Step 2
            a2 = llm.run_agent_2_technical_evaluator(cand.resume_text, req.job_description, a1)
            # Step 3
            a3 = llm.run_agent_3_challenger(cand.resume_text, req.job_description, a1, a2)
            # Step 4
            a4 = llm.run_agent_4_hiring_judge(cand.resume_text, req.job_description, a1, a2, a3)

            cid = cand.candidate_id or f"cand_{uuid.uuid4().hex[:8]}"
            name = cand.candidate_name or "Candidate"

            profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == cid).first()
            if not profile:
                profile = CandidateProfile(
                    candidate_id=cid,
                    name=name,
                    education="Extracted via pipeline",
                    experience="Extracted via pipeline",
                    skills=""
                )
                db.add(profile)
                db.commit()

            eval_record = Evaluation(
                candidate_id=cid,
                job_description=req.job_description[:2000],
                overall_score=a4.get("overall_score", 75),
                final_recommendation=a4.get("final_recommendation", "Consider"),
                confidence=a4.get("confidence", 80),
                category_scores=json.dumps(a4.get("category_scores", {})),
                strengths=json.dumps(a4.get("strengths", [])),
                concerns=json.dumps(a4.get("concerns", [])),
                evidence_ids=json.dumps(a4.get("evidence", [])),
                panel_debate=a4.get("panel_debate", ""),
                technical_questions=json.dumps(a2.get("questions", [])),
                agent_outputs=json.dumps({
                    "agent1": a1,
                    "agent2": a2,
                    "agent3": a3,
                    "agent4": a4
                })
            )
            db.add(eval_record)
            db.commit()

            evaluations.append({
                "candidate_id": cid,
                "candidate_name": name,
                "filename": cand.filename,
                "evaluation_id": eval_record.id,
                "overall_score": a4.get("overall_score", 75),
                "final_recommendation": a4.get("final_recommendation", "Consider"),
                "confidence": a4.get("confidence", 80),
                "category_scores": a4.get("category_scores", {}),
                "strengths": a4.get("strengths", []),
                "concerns": a4.get("concerns", []),
                "evidence": a4.get("evidence", []),
                "panel_debate": a4.get("panel_debate", ""),
                "technical_questions": a2.get("questions", []),
                "agent1": a1,
                "agent2": a2,
                "agent3": a3,
                "agent4": a4
            })
        except Exception as e:
            logger.error(f"Error evaluating candidate {cand.candidate_name}: {e}")
            db.rollback()
            evaluations.append({
                "candidate_id": cand.candidate_id or f"cand_{uuid.uuid4().hex[:8]}",
                "candidate_name": cand.candidate_name or "Candidate",
                "filename": cand.filename,
                "error": str(e)
            })

    return {
        "status": "success",
        "total_evaluated": len(evaluations),
        "results": evaluations
    }


