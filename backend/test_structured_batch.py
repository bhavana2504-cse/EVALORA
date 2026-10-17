"""
Unit & Integration test for 3 dropdowns, candidate counting, and structured batch evaluation.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_extract_text_endpoint():
    file_content = b"Alex Johnson resume: 5 years experience in Python and FastAPI."
    files = {"file": ("Alex_Resume.txt", file_content, "text/plain")}
    res = client.post("/api/v1/upload/extract-text", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Parsed successfully"
    assert "Alex Johnson" in data["extracted_text"]

def test_structured_batch_two_candidates():
    payload = {
        "job_description": "Senior Full Stack Engineer. Python and React.",
        "role": "Senior Full Stack Engineer",
        "candidates": [
            {
                "name": "Alex Johnson",
                "resume_text": "Alex Johnson resume: 5 years experience in Python, FastAPI, and React.",
                "transcript_text": "Interviewer: How do you design microservices? Alex: With FastAPI and PostgreSQL.",
                "resume_filename": "Alex_Johnson_Resume.pdf",
                "transcript_filename": "Alex_Johnson_Transcript.txt"
            },
            {
                "name": "Elena Rostova",
                "resume_text": "Dr. Elena Rostova CV: 6 years experience in distributed systems and PyTorch.",
                "transcript_text": "Interviewer: Tell us about async architecture. Elena: I built WebSocket stream handlers.",
                "resume_filename": "Elena_Rostova_Resume.pdf",
                "transcript_filename": "Elena_Rostova_Transcript.txt"
            }
        ]
    }
    res = client.post("/api/v1/upload/process-structured-batch", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    # Exactly 2 candidates evaluated from 5 total files (1 JD + 2 resumes + 2 transcripts)
    assert data["total_candidates"] == 2
    assert len(data["candidates"]) == 2
    assert data["candidates"][0]["candidate_name"] == "Alex Johnson"
    assert data["candidates"][1]["candidate_name"] == "Elena Rostova"
    assert "RESUME" in data["candidates"][0]["extracted_text"]
    assert "TRANSCRIPT" in data["candidates"][0]["extracted_text"]
    print("[PASS] test_structured_batch_two_candidates: Exactly 2 candidates evaluated")

if __name__ == "__main__":
    test_extract_text_endpoint()
    test_structured_batch_two_candidates()
    print("All structured batch evaluation tests PASSED successfully.")
