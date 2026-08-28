from fastapi import APIRouter, UploadFile, File, HTTPException
from processing.pdf_parser import extract_text_from_pdf
from utils.llm import LLMProvider

router = APIRouter(tags=["Document Processing"])
llm = LLMProvider()

@router.post("/upload/job-description")
async def upload_job_description(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    content = await file.read()
    try:
        text = extract_text_from_pdf(content)
        # We can extract structured JD info later, just keeping it simple for now
        return {"filename": file.filename, "status": "Parsed successfully", "extracted_length": len(text)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/candidate")
async def upload_candidate_document(file: UploadFile = File(...), doc_type: str = "resume", candidate_id: str = "A"):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    content = await file.read()
    try:
        text = extract_text_from_pdf(content)
        profile_data = llm.extract_profile(text)
        return {
            "filename": file.filename, 
            "candidate_id": candidate_id,
            "type": doc_type,
            "status": "Parsed successfully", 
            "extracted_length": len(text),
            "profile_data": profile_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
