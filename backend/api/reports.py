from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json

router = APIRouter(tags=["Reports"])

@router.get("/reports/{candidate_id}/export")
async def export_report(candidate_id: str):
    """
    Exports the comprehensive report for a given candidate.
    """
    try:
        # Mocking the JSON report generation
        report_data = {
            "candidate_id": candidate_id,
            "overview": {
                "name": "Candidate A",
                "role": "Software Engineer",
                "recommendation": "Proceed to Interview",
                "confidence": 82
            },
            "evidence": ["E12", "E17"],
            "debate_summary": "Skeptic and Tech debated ML depth; Tech adjusted confidence.",
            "final_reasoning": "Candidate shows strong python skills and meets core requirements."
        }
        
        return JSONResponse(content=report_data, headers={
            "Content-Disposition": f"attachment; filename=Evalora_Report_{candidate_id}.json"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
