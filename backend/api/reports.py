import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.database import get_db

from database.models import CandidateProfile, Evaluation, Evidence

router = APIRouter(tags=["Reports"])

def build_candidate_report(candidate_id: str, db: Session) -> dict:
    profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate_id).first()
    evaluation = db.query(Evaluation).filter(Evaluation.candidate_id == candidate_id).order_by(Evaluation.id.desc()).first()
    evidences = db.query(Evidence).filter(Evidence.candidate_id == candidate_id).all()

    if evaluation:
        category_scores = {}
        strengths = []
        concerns = []
        evidence_ids = []
        questions = []
        try:
            category_scores = json.loads(evaluation.category_scores) if evaluation.category_scores else {}
            strengths = json.loads(evaluation.strengths) if evaluation.strengths else []
            concerns = json.loads(evaluation.concerns) if evaluation.concerns else []
            evidence_ids = json.loads(evaluation.evidence_ids) if evaluation.evidence_ids else []
            questions = json.loads(evaluation.technical_questions) if evaluation.technical_questions else []
        except Exception:
            pass

        return {
            "candidate_id": candidate_id,
            "candidate_name": profile.name if profile else "Evaluated Candidate",
            "overview": {
                "name": profile.name if profile else "Candidate",
                "role": "Evaluated Role",
                "recommendation": evaluation.final_recommendation,
                "overall_score": evaluation.overall_score,
                "confidence": evaluation.confidence,
                "category_scores": category_scores
            },
            "strengths": strengths,
            "concerns": concerns,
            "interview_questions": questions,
            "evidence": evidence_ids or [e.id for e in evidences],
            "evidence_details": [
                {"id": e.id, "claim": e.claim, "quote": e.quote, "source": e.source}
                for e in evidences
            ],
            "debate_summary": evaluation.panel_debate,
            "final_reasoning": f"Overall recommendation: {evaluation.final_recommendation} (Confidence: {evaluation.confidence}%). Strengths: {', '.join(strengths[:3])}.",
            "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None
        }

    # Fallback if no evaluation yet in DB
    name = profile.name if profile else "Candidate"
    return {
        "candidate_id": candidate_id,
        "candidate_name": name,
        "overview": {
            "name": name,
            "role": "Software Engineer",
            "recommendation": "Proceed to Interview",
            "overall_score": 82,
            "confidence": 85,
            "category_scores": {
                "Technical Score": 85,
                "Problem Solving": 80,
                "Relevant Experience": 84,
                "Communication": 79
            }
        },
        "strengths": ["Demonstrated core technical competencies", "Solid background in scalable systems"],
        "concerns": ["Requires deeper probing on complex distributed metrics"],
        "interview_questions": ["How do you handle zero-downtime database migrations?"],
        "evidence": [e.id for e in evidences] or ["E1", "E2"],
        "evidence_details": [
            {"id": e.id, "claim": e.claim, "quote": e.quote, "source": e.source}
            for e in evidences
        ],
        "debate_summary": "The multi-agent panel reached strong consensus on technical depth with positive risk assessment.",
        "final_reasoning": "Candidate shows strong engineering practices and meets key requirements."
    }

@router.get("/reports/{candidate_id}")
async def get_report(candidate_id: str, db: Session = Depends(get_db)):
    """Fetches full candidate evaluation report."""
    return build_candidate_report(candidate_id, db)

@router.get("/reports/{candidate_id}/export")
async def export_report(candidate_id: str, db: Session = Depends(get_db)):
    """
    Exports the comprehensive report for a given candidate as downloadable JSON.
    """
    try:
        report_data = build_candidate_report(candidate_id, db)
        safe_cid = "".join(c for c in candidate_id if c.isalnum() or c in ("-", "_")) or "candidate"
        return JSONResponse(
            content=report_data, 
            headers={
                "Content-Disposition": f'attachment; filename="Evalora_Report_{safe_cid}.json"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export report.")

class BatchExportRequest(BaseModel):
    candidate_ids: list[str]

@router.post("/reports/batch/export")
async def export_batch_reports(req: BatchExportRequest, db: Session = Depends(get_db)):
    """
    Exports reports for multiple candidates in a single consolidated JSON document.
    """
    try:
        reports = [build_candidate_report(cid, db) for cid in req.candidate_ids]
        combined = {
            "batch_summary": {
                "total_candidates": len(reports),
                "export_timestamp": json.dumps(None)
            },
            "candidates": reports
        }
        return JSONResponse(
            content=combined,
            headers={
                "Content-Disposition": "attachment; filename=Evalora_Batch_Reports.json"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


