import re
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import CandidateProfile, Evidence
from processing.pdf_parser import extract_text_from_pdf
from utils.llm import LLMProvider

router = APIRouter(tags=["Document Processing"])
llm = LLMProvider()

import os

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file
MAX_BATCH_FILES = 20  # Maximum files allowed in a single batch upload
MAX_TEXT_LENGTH = 100_000  # 100k characters max per document text to prevent DoS

ALLOWED_EXTENSIONS = ('.pdf', '.txt', '.md', '.json')

def parse_file_content(filename: str, content: bytes) -> str:
    """Parses text from PDF or plain text / markdown files with signature checks."""
    # Sanitize filename against path traversal
    safe_name = os.path.basename(filename or 'upload').strip()
    # Remove any null bytes or control characters in filename
    safe_name = re.sub(r'[\x00-\x1f\x7f]', '', safe_name)
    if not safe_name:
        safe_name = "upload.txt"

    filename_lower = safe_name.lower()
    
    if not any(filename_lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{safe_name}'. Only PDF, TXT, and Markdown files are accepted."
        )

    if filename_lower.endswith('.pdf'):
        # Validate PDF Magic Bytes (%PDF-)
        if not content.startswith(b'%PDF-'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid PDF file signature in '{safe_name}'. The file appears to be corrupted or spoofed."
            )
        return extract_text_from_pdf(content)
    elif filename_lower.endswith(('.txt', '.md', '.json')):
        # Reject executable/binary content disguised as text
        if b'\x00' in content[:1024]:
            raise HTTPException(
                status_code=400,
                detail=f"Binary content detected in text file '{safe_name}'. Only valid text documents are supported."
            )
        return content.decode('utf-8', errors='ignore').strip()
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{safe_name}'. Only PDF, TXT, and Markdown files are accepted."
        )

def validate_and_read_file(file: UploadFile, content: bytes) -> str:
    """Validates file size, signature, and extension, then parses text content."""
    safe_name = os.path.basename(file.filename or 'upload').strip()
    safe_name = re.sub(r'[\x00-\x1f\x7f]', '', safe_name) or "upload.txt"
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File '{safe_name}' exceeds maximum allowed size of 10 MB ({round(len(content)/(1024*1024), 2)} MB)."
        )
    return parse_file_content(safe_name, content)

@router.post("/upload/extract-text")
async def extract_uploaded_file_text(file: UploadFile = File(...)):
    """Extracts text from PDF, TXT, or MD without saving to database."""
    content = await file.read()
    try:
        text = validate_and_read_file(file, content)
        return {
            "filename": file.filename,
            "status": "Parsed successfully",
            "extracted_text": text,
            "extracted_length": len(text),
            "file_size": len(content)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/candidate")
async def upload_candidate_document(
    file: UploadFile = File(...), 
    doc_type: str = "resume", 
    candidate_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    content = await file.read()
    try:
        text = validate_and_read_file(file, content)
        cid = candidate_id or f"cand_{uuid.uuid4().hex[:8]}"
        
        # Extract structured candidate profile using Gemini
        profile_data = llm.extract_profile(text)

        # Save/update candidate profile in database
        existing_profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == cid).first()
        cand_name = profile_data.get("name", file.filename.replace(".pdf", "").replace(".txt", "").replace("_", " "))
        if not existing_profile:
            candidate_record = CandidateProfile(
                candidate_id=cid,
                name=cand_name,
                education=profile_data.get("education", ""),
                experience=profile_data.get("experience", ""),
                skills=profile_data.get("skills", "")
            )
            db.add(candidate_record)
        else:
            existing_profile.name = cand_name
            existing_profile.education = profile_data.get("education", existing_profile.education)
            existing_profile.experience = profile_data.get("experience", existing_profile.experience)
            existing_profile.skills = profile_data.get("skills", existing_profile.skills)

        # Save extracted claims as Evidence items
        for idx, claim_item in enumerate(profile_data.get("claims", [])):
            evidence_id = f"E{idx + 1}_{cid[:4]}"
            existing_ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
            if not existing_ev:
                ev_record = Evidence(
                    id=evidence_id,
                    candidate_id=cid,
                    claim=claim_item.get("claim", ""),
                    quote=claim_item.get("quote", ""),
                    source=claim_item.get("source", doc_type.capitalize())
                )
                db.add(ev_record)
        
        db.commit()

        return {
            "filename": file.filename, 
            "file_size": len(content),
            "candidate_id": cid,
            "candidate_name": cand_name,
            "type": doc_type,
            "status": "Parsed successfully", 
            "extracted_text": text,
            "extracted_length": len(text),
            "profile_data": profile_data
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/candidates-batch")
async def upload_candidates_batch(
    files: list[UploadFile] = File(...),
    doc_type: str = "resume",
    db: Session = Depends(get_db)
):
    """
    Accepts and processes multiple files at once.
    Correctly identifies and groups documents belonging to the same candidate,
    extracts structured profiles, validates sizes/formats, and saves candidates to SQLite.
    Files belonging to the same candidate are aggregated rather than counted as separate candidates.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded. Please select one or more files.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(status_code=400, detail=f"Exceeded maximum file upload batch size ({len(files)} > {MAX_BATCH_FILES}).")

    # Dictionary to group documents by normalized candidate identity
    candidates_map = {}
    errors = []

    for file in files:
        content = await file.read()
        try:
            text = validate_and_read_file(file, content)
            profile_data = llm.extract_profile(text)
            
            # Extract candidate name from AI profile or clean filename
            extracted_name = profile_data.get("name")
            if not extracted_name or extracted_name.strip() in ["", "Unknown", "Candidate", "None"]:
                # Clean up file name by removing common document words
                base_name = file.filename
                for ext in [".pdf", ".txt", ".md", ".json"]:
                    base_name = base_name.replace(ext, "")
                # Strip out common noise like resume, cv, transcript, portfolio, v1, v2, final
                cleaned = re.sub(r'(?i)[_\-\.]*(resume|cv|transcript|portfolio|final|doc|v\d+)[_\-\.]*', ' ', base_name)
                cleaned = re.sub(r'[_\-]+', ' ', cleaned).strip()
                extracted_name = cleaned.title() if cleaned else "Candidate"
            else:
                extracted_name = extracted_name.strip()

            # Look for explicit contact markers for stronger identity grouping
            # (e.g. email in text)
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
            contact_key = email_match.group(0).lower() if email_match else None

            # Normalize name key for grouping (e.g. "Alex Johnson" -> "alex johnson")
            norm_name = " ".join(extracted_name.lower().split())
            norm_key = contact_key if contact_key else norm_name

            if norm_key not in candidates_map:
                cid = f"cand_{uuid.uuid4().hex[:8]}"
                candidates_map[norm_key] = {
                    "candidate_id": cid,
                    "candidate_name": extracted_name,
                    "filenames": [file.filename],
                    "file_sizes": [len(content)],
                    "extracted_texts": [text],
                    "profile_data": profile_data,
                    "education": profile_data.get("education", ""),
                    "experience": profile_data.get("experience", ""),
                    "skills": profile_data.get("skills", ""),
                    "claims": list(profile_data.get("claims", []))
                }
            else:
                # Same candidate detected! Aggregate the new document into the candidate record
                cand_entry = candidates_map[norm_key]
                cand_entry["filenames"].append(file.filename)
                cand_entry["file_sizes"].append(len(content))
                cand_entry["extracted_texts"].append(text)
                
                # Merge profile information if existing fields are empty
                if not cand_entry["education"] and profile_data.get("education"):
                    cand_entry["education"] = profile_data.get("education")
                if not cand_entry["experience"] and profile_data.get("experience"):
                    cand_entry["experience"] = profile_data.get("experience")
                if profile_data.get("skills"):
                    cand_entry["skills"] = f"{cand_entry['skills']}, {profile_data.get('skills')}".strip(", ")
                
                # Append new claims
                cand_entry["claims"].extend(profile_data.get("claims", []))

        except HTTPException as he:
            errors.append(f"{file.filename}: {he.detail}")
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")

    if errors and len(candidates_map) == 0:
        db.rollback()
        raise HTTPException(status_code=400, detail="; ".join(errors))

    # Save unique candidates and evidence records into database
    results = []
    for cand_entry in candidates_map.values():
        cid = cand_entry["candidate_id"]
        cand_name = cand_entry["candidate_name"]

        candidate_record = CandidateProfile(
            candidate_id=cid,
            name=cand_name,
            education=cand_entry["education"],
            experience=cand_entry["experience"],
            skills=cand_entry["skills"]
        )
        db.add(candidate_record)

        for idx, claim_item in enumerate(cand_entry["claims"]):
            evidence_id = f"E{idx + 1}_{cid[:4]}"
            existing_ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
            if not existing_ev:
                ev_record = Evidence(
                    id=evidence_id,
                    candidate_id=cid,
                    claim=claim_item.get("claim", "") if isinstance(claim_item, dict) else str(claim_item),
                    quote=claim_item.get("quote", "") if isinstance(claim_item, dict) else "",
                    source=claim_item.get("source", doc_type.capitalize()) if isinstance(claim_item, dict) else doc_type.capitalize()
                )
                db.add(ev_record)

        db.commit()

        # Combine text from all documents for comprehensive evaluation
        combined_text = "\n\n--- ADDITIONAL DOCUMENT ---\n\n".join(cand_entry["extracted_texts"])

        results.append({
            "candidate_id": cid,
            "candidate_name": cand_name,
            "filename": ", ".join(cand_entry["filenames"]),
            "filenames": cand_entry["filenames"],
            "document_count": len(cand_entry["filenames"]),
            "file_size": sum(cand_entry["file_sizes"]),
            "type": doc_type,
            "status": "Parsed successfully",
            "extracted_text": combined_text,
            "extracted_length": len(combined_text),
            "profile_data": cand_entry["profile_data"]
        })

    return {
        "status": "success",
        "total_files": len(files),
        "total_candidates": len(results),
        "candidates": results,
        "warnings": errors if errors else None
    }

class CandidateDocInfo(BaseModel):
    name: str
    resume_text: str
    transcript_text: Optional[str] = ""
    resume_filename: Optional[str] = "resume.pdf"
    transcript_filename: Optional[str] = ""

class StructuredEvalBatchRequest(BaseModel):
    job_description: str
    candidates: list[CandidateDocInfo]
    role: Optional[str] = "Selected Role"

@router.post("/upload/process-structured-batch")
async def process_structured_batch(
    payload: StructuredEvalBatchRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts 1 job description + multiple candidate resumes + matched transcripts.
    Accurately computes candidate count based on distinct candidates,
    not raw file count.
    Saves candidate records and associates evidence separately for each candidate.
    """
    if not payload.candidates or len(payload.candidates) == 0:
        raise HTTPException(status_code=400, detail="No candidates provided for evaluation.")
    if len(payload.candidates) > 20:
        raise HTTPException(status_code=400, detail="Cannot evaluate more than 20 candidates in a single batch.")

    parsed_candidates = []
    for cand in payload.candidates:
        cid = f"cand_{uuid.uuid4().hex[:8]}"
        clean_name = cand.name.strip() or "Candidate"

        resume_txt = (cand.resume_text or "")[:MAX_TEXT_LENGTH]
        transcript_txt = (cand.transcript_text or "")[:MAX_TEXT_LENGTH]
        safe_resume_filename = os.path.basename(cand.resume_filename or "resume.pdf").strip()
        safe_transcript_filename = os.path.basename(cand.transcript_filename or "").strip()

        # Combine resume + transcript with clear delineation
        combined_text = f"=== RESUME ({safe_resume_filename}) ===\n{resume_txt.strip()}"
        if transcript_txt.strip():
            combined_text += f"\n\n=== INTERVIEW TRANSCRIPT ({safe_transcript_filename}) ===\n{transcript_txt.strip()}"

        try:
            profile_data = llm.extract_profile(combined_text)
        except Exception:
            profile_data = {
                "name": clean_name,
                "education": "Extracted from provided documents",
                "experience": "Extracted from provided documents",
                "skills": "",
                "claims": []
            }

        candidate_record = CandidateProfile(
            candidate_id=cid,
            name=clean_name,
            education=profile_data.get("education", ""),
            experience=profile_data.get("experience", ""),
            skills=profile_data.get("skills", "")
        )
        db.add(candidate_record)

        # Record claims
        for idx, claim_item in enumerate(profile_data.get("claims", [])):
            evidence_id = f"E{idx + 1}_{cid[:4]}"
            existing_ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
            if not existing_ev:
                ev_record = Evidence(
                    id=evidence_id,
                    candidate_id=cid,
                    claim=claim_item.get("claim", "") if isinstance(claim_item, dict) else str(claim_item),
                    quote=claim_item.get("quote", "") if isinstance(claim_item, dict) else "",
                    source=claim_item.get("source", "Resume/Transcript") if isinstance(claim_item, dict) else "Resume/Transcript"
                )
                db.add(ev_record)

        db.commit()

        filenames = [cand.resume_filename]
        if cand.transcript_filename:
            filenames.append(cand.transcript_filename)

        parsed_candidates.append({
            "candidate_id": cid,
            "candidate_name": clean_name,
            "filename": ", ".join(filenames),
            "filenames": filenames,
            "document_count": len(filenames),
            "file_size": len(combined_text.encode('utf-8')),
            "type": "resume_and_transcript",
            "status": "Parsed successfully",
            "extracted_text": combined_text,
            "extracted_length": len(combined_text),
            "profile_data": profile_data
        })

    return {
        "status": "success",
        "job_description": payload.job_description,
        "total_candidates": len(parsed_candidates),
        "candidates": parsed_candidates
    }

class CandidateTextRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = ""
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None

@router.post("/upload/parse-text")
async def parse_candidate_text(req: CandidateTextRequest, db: Session = Depends(get_db)):
    """Parses raw candidate text directly without requiring a file upload."""
    try:
        cid = req.candidate_id or f"cand_{uuid.uuid4().hex[:8]}"
        profile_data = llm.extract_profile(req.resume_text)
        
        existing = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == cid).first()
        name = req.candidate_name or profile_data.get("name", "Candidate")
        if not existing:
            rec = CandidateProfile(
                candidate_id=cid,
                name=name,
                education=profile_data.get("education", ""),
                experience=profile_data.get("experience", ""),
                skills=profile_data.get("skills", "")
            )
            db.add(rec)
            db.commit()

        return {
            "candidate_id": cid,
            "candidate_name": name,
            "status": "Parsed successfully",
            "profile_data": profile_data
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


