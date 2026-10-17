"""
Comprehensive integration test for Evalora Backend API.
Tests all endpoints, database persistence, LLM agent pipeline, and bonus features.
"""
import sys
import json
from fastapi.testclient import TestClient
from main import app
from database.database import Base, engine, SessionLocal
from database.models import CandidateProfile, Evaluation, DecisionOverride

client = TestClient(app)

def test_endpoints():
    print("========================================")
    print("STARTING EVALORA BACKEND AUDIT TEST")
    print("========================================")

    # 1. Health & Root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] 1. Root endpoint: OK")

    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    print("[PASS] 2. Health endpoint: OK")

    # 2. Database table verification
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    assert db is not None
    print("[PASS] 3. Database session and tables: OK")

    # 3. Direct Candidate Text Parsing
    test_resume = """
    Alex Johnson
    Senior Full Stack Engineer with 5 years experience in Python, FastAPI, React, and TypeScript.
    Architected and deployed microservices on AWS ECS handling 25M daily requests.
    Education: B.S. in Computer Science from University of Washington.
    """
    test_jd = "Senior Full Stack Engineer. Must have 4+ years of Python and React experience."
    test_cid = "test_cand_001"

    res = client.post("/api/v1/upload/parse-text", json={
        "resume_text": test_resume,
        "candidate_name": "Alex Johnson",
        "candidate_id": test_cid,
        "job_description": test_jd
    })
    assert res.status_code == 200, f"Upload parse-text failed: {res.text}"
    data = res.json()
    assert data["status"] == "Parsed successfully"
    print("[PASS] 4. Candidate text parsing and extraction: OK")

    # Verify candidate exists in SQLite
    cand = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == test_cid).first()
    assert cand is not None, "Candidate not found in DB!"
    print(f"[PASS] 5. Candidate profile persisted in SQLite: {cand.name}")

    # 4. Agent 1
    print("\n--- Testing Agent 1 (Resume Analyst) ---")
    res1 = client.post("/api/v1/pipeline/agent1", json={
        "resume_text": test_resume,
        "job_description": test_jd,
        "candidate_id": test_cid,
        "candidate_name": "Alex Johnson"
    })
    assert res1.status_code == 200, f"Agent 1 failed: {res1.text}"
    a1_data = res1.json()["data"]
    assert "strengths" in a1_data and "gaps" in a1_data
    print(f"[PASS] 6. Agent 1 response valid: {len(a1_data.get('strengths', []))} strengths identified")

    # 5. Agent 2
    print("\n--- Testing Agent 2 (Technical Evaluator) ---")
    res2 = client.post("/api/v1/pipeline/agent2", json={
        "resume_text": test_resume,
        "job_description": test_jd,
        "candidate_id": test_cid,
        "candidate_name": "Alex Johnson",
        "agent1_output": a1_data
    })
    assert res2.status_code == 200, f"Agent 2 failed: {res2.text}"
    a2_data = res2.json()["data"]
    assert "questions" in a2_data
    print(f"[PASS] 7. Agent 2 response valid: {len(a2_data.get('questions', []))} technical questions generated")

    # 6. Agent 3
    print("\n--- Testing Agent 3 (Challenger) ---")
    res3 = client.post("/api/v1/pipeline/agent3", json={
        "resume_text": test_resume,
        "job_description": test_jd,
        "candidate_id": test_cid,
        "candidate_name": "Alex Johnson",
        "agent1_output": a1_data,
        "agent2_output": a2_data
    })
    assert res3.status_code == 200, f"Agent 3 failed: {res3.text}"
    a3_data = res3.json()["data"]
    print(f"[PASS] 8. Agent 3 response valid: {len(a3_data.get('challenges', []))} challenges formulated")

    # 7. Agent 4
    print("\n--- Testing Agent 4 (Hiring Judge) ---")
    res4 = client.post("/api/v1/pipeline/agent4", json={
        "resume_text": test_resume,
        "job_description": test_jd,
        "candidate_id": test_cid,
        "candidate_name": "Alex Johnson",
        "agent1_output": a1_data,
        "agent2_output": a2_data,
        "agent3_output": a3_data
    })
    assert res4.status_code == 200, f"Agent 4 failed: {res4.text}"
    a4_data = res4.json()["data"]
    assert "final_recommendation" in a4_data and "overall_score" in a4_data
    print(f"[PASS] 9. Agent 4 verdict: {a4_data['final_recommendation']} (Score: {a4_data['overall_score']}/100)")

    # Verify evaluation persisted in SQLite
    eval_rec = db.query(Evaluation).filter(Evaluation.candidate_id == test_cid).order_by(Evaluation.id.desc()).first()
    assert eval_rec is not None, "Evaluation not found in DB!"
    print(f"[PASS] 10. Evaluation persisted in SQLite (ID: {eval_rec.id}, Verdict: {eval_rec.final_recommendation})")

    # 8. Report API
    res_rep = client.get(f"/api/v1/reports/{test_cid}")
    assert res_rep.status_code == 200, f"Get report failed: {res_rep.text}"
    rep_json = res_rep.json()
    assert rep_json["candidate_id"] == test_cid
    print(f"[PASS] 11. Real report retrieved from database for {test_cid}: OK")

    res_exp = client.get(f"/api/v1/reports/{test_cid}/export")
    assert res_exp.status_code == 200, f"Export report failed: {res_exp.text}"
    assert "attachment; filename=" in res_exp.headers.get("Content-Disposition", "")
    print("[PASS] 12. Report export endpoint with Content-Disposition: OK")

    # 9. Bonus Features: What-If simulation
    print("\n--- Testing What-If Simulation ---")
    res_sim = client.post("/api/v1/bonus/simulate", json={
        "candidate_id": test_cid,
        "scenario": "What if candidate had 2 years less experience?"
    })
    assert res_sim.status_code == 200, f"Simulate failed: {res_sim.text}"
    sim_data = res_sim.json()
    assert sim_data["status"] == "success"
    print(f"[PASS] 13. What-If Simulation via /api/v1/bonus/simulate: {sim_data.get('simulated_decision')}")

    # Also test /api/v1/simulate prefix
    res_sim2 = client.post("/api/v1/simulate", json={
        "candidate_id": test_cid,
        "scenario": "What if candidate had deep expertise in distributed locks and Redis?"
    })
    assert res_sim2.status_code == 200
    print("[PASS] 14. What-If Simulation via /api/v1/simulate: OK")

    # 10. Bonus Features: Human Override
    print("\n--- Testing Human Override ---")
    res_ovr = client.post("/api/v1/bonus/override", json={
        "candidate_id": test_cid,
        "reason": "Outstanding open-source contributions compensate for specific tool gaps.",
        "override_decision": "Hire"
    })
    assert res_ovr.status_code == 200
    ovr_data = res_ovr.json()
    assert ovr_data["status"] == "success"
    print("[PASS] 15. Human Override via /api/v1/bonus/override: OK")

    # Verify override persisted in DB
    ovr_rec = db.query(DecisionOverride).filter(DecisionOverride.candidate_id == test_cid).first()
    assert ovr_rec is not None
    print(f"[PASS] 16. DecisionOverride persisted in SQLite (Decision: {ovr_rec.override_decision})")

    # 11. Security Protections Verification
    print("\n--- Testing Security Protections ---")
    
    # Path traversal attack rejection
    res_trav = client.post("/api/v1/upload/extract-text", files={"file": ("../../etc/passwd", b"malicious", "text/plain")})
    assert res_trav.status_code == 400
    print("[PASS] 17. Path traversal rejected: OK")

    # Spoofed PDF signature validation
    res_fake_pdf = client.post("/api/v1/upload/extract-text", files={"file": ("resume.pdf", b"NOT_A_PDF_MAGIC_BYTES", "application/pdf")})
    assert res_fake_pdf.status_code == 400
    assert "Invalid PDF file signature" in res_fake_pdf.text
    print("[PASS] 18. Spoofed PDF signature rejected: OK")

    # Binary executable disguised as text
    res_binary_txt = client.post("/api/v1/upload/extract-text", files={"file": ("resume.txt", b"\x00\x01\x02\x03fake_binary", "text/plain")})
    assert res_binary_txt.status_code == 400
    assert "Binary content detected" in res_binary_txt.text
    print("[PASS] 19. Disguised binary content rejected: OK")

    # Security headers verification
    res_sec_head = client.get("/api/v1/health")
    assert res_sec_head.headers.get("X-Content-Type-Options") == "nosniff"
    assert res_sec_head.headers.get("X-Frame-Options") == "DENY"
    print("[PASS] 20. Security headers verified: OK")

    db.close()
    print("\n========================================")
    print("ALL EVALORA BACKEND AUDIT TESTS PASSED!")
    print("========================================")

if __name__ == "__main__":
    test_endpoints()

