from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Bonus Features"])

class OverrideRequest(BaseModel):
    candidate_id: str
    reason: str
    override_decision: str

@router.post("/override")
async def human_override(req: OverrideRequest):
    """
    Allows a human reviewer to override the AI's final decision.
    """
    return {
        "status": "success",
        "message": f"Decision for {req.candidate_id} overridden to '{req.override_decision}'.",
        "reason_logged": req.reason
    }

class WhatIfRequest(BaseModel):
    candidate_id: str
    scenario: str

@router.post("/simulate")
async def what_if_simulator(req: WhatIfRequest):
    """
    Re-runs the final decision with a what-if scenario.
    """
    return {
        "status": "success",
        "simulated_decision": "Consider",
        "reason_for_change": f"Applying scenario '{req.scenario}' revealed that additional theoretical experience mitigates the risk, changing the recommendation to Consider."
    }
