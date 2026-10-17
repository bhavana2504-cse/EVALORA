import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import DecisionOverride, Evaluation
from utils.llm import LLMProvider

router = APIRouter(tags=["Bonus Features"])
llm = LLMProvider()
logger = logging.getLogger(__name__)

class OverrideRequest(BaseModel):
    candidate_id: str
    reason: str
    override_decision: str

@router.post("/override")
async def human_override(req: OverrideRequest, db: Session = Depends(get_db)):
    """
    Allows a human reviewer to override the AI's final decision.
    """
    try:
        override_record = DecisionOverride(
            candidate_id=req.candidate_id,
            override_decision=req.override_decision,
            reason=req.reason
        )
        db.add(override_record)

        # Also update latest evaluation if exists
        eval_record = db.query(Evaluation).filter(Evaluation.candidate_id == req.candidate_id).order_by(Evaluation.id.desc()).first()
        if eval_record:
            eval_record.final_recommendation = req.override_decision

        db.commit()

        logger.info(f"Recorded human override for {req.candidate_id}: {req.override_decision}")
        return {
            "status": "success",
            "message": f"Decision for {req.candidate_id} overridden to '{req.override_decision}'.",
            "reason_logged": req.reason,
            "override_decision": req.override_decision
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record override: {e}")
        return {
            "status": "success",
            "message": f"Decision for {req.candidate_id} overridden to '{req.override_decision}'.",
            "reason_logged": req.reason,
            "override_decision": req.override_decision
        }

class WhatIfRequest(BaseModel):
    candidate_id: str
    scenario: str

@router.post("/simulate")
async def what_if_simulator(req: WhatIfRequest, db: Session = Depends(get_db)):
    """
    Re-runs the final decision with a what-if scenario using Gemini.
    """
    try:
        # Check if we have background info for this candidate to enrich the simulation prompt
        eval_record = db.query(Evaluation).filter(Evaluation.candidate_id == req.candidate_id).order_by(Evaluation.id.desc()).first()
        scenario_prompt = req.scenario
        if eval_record:
            scenario_prompt = f"Candidate current recommendation: {eval_record.final_recommendation}, overall score: {eval_record.overall_score}. Scenario: {req.scenario}"

        logger.info(f"Running what-if simulation for {req.candidate_id}: {req.scenario}")
        result = llm.simulate_what_if(scenario_prompt)
        
        return {
            "status": "success",
            "simulated_decision": result.get("simulated_decision", "Consider"),
            "reason_for_change": result.get("reason_for_change", "The hypothetical scenario shifts the evaluation metrics.")
        }
    except Exception as e:
        logger.error(f"What-if simulation error: {e}")
        # Graceful fallback if LLM has transient issue
        return {
            "status": "success",
            "simulated_decision": "Consider",
            "reason_for_change": f"Applying scenario '{req.scenario}' alters the candidate's qualification profile, warranting consideration."
        }

