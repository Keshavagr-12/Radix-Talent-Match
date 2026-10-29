"""
RADIX JD Analytics Microservice (FastAPI on Port 8001).
Extracts, structures, and classifies technical competencies and RADIX categories
from uploaded job descriptions in multiple formats (PDF, Word DOCX/DOC, TXT, MD) and raw text.
Persists all real analyzed JDs without generating any artificial mock/sample data.
"""

import os
import re
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure environment variables are loaded
_this_dir = Path(__file__).resolve().parent
load_dotenv(_this_dir / ".env")
load_dotenv(_this_dir.parent / ".env")
load_dotenv()

# Resilient imports (supports both relative package import and standalone script execution)
try:
    from .extractor import extract_text
    from .analyzer import analyze_job_description, fallback_skill_extractor
    from .schemas import (
        JobAnalysis,
        Skill,
        TextAnalysisRequest,
        ExtractedSkillListResponse,
    )
    from .storage import (
        get_all_jobs,
        get_job_by_id,
        save_job,
        delete_job,
        clear_all_jobs,
    )
except (ImportError, ValueError):
    from extractor import extract_text
    from analyzer import analyze_job_description, fallback_skill_extractor
    from schemas import (
        JobAnalysis,
        Skill,
        TextAnalysisRequest,
        ExtractedSkillListResponse,
    )
    from storage import (
        get_all_jobs,
        get_job_by_id,
        save_job,
        delete_job,
        clear_all_jobs,
    )

app = FastAPI(
    title="RADIX JD Analytics API",
    description="Extracts, classifies, and maps job description skills to the 12 official RADIX competency categories. Real persistent storage; no artificial mock sample data.",
    version="2.1.0",
)

# Robust CORS Configuration for Vite (5173), Next.js (3000), and all local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RADIX_CATEGORIES = [
    {"code": "COD", "name": "Coding", "description": "Programming languages, syntax, and coding proficiency"},
    {"code": "DSA", "name": "Data Structures & Algorithms", "description": "Problem solving, data structures, and algorithmic complexity"},
    {"code": "OOD", "name": "Object-Oriented Design", "description": "OOP principles, design patterns, and SOLID design"},
    {"code": "APTI", "name": "Aptitude", "description": "Quantitative reasoning, logical problem solving, and numeric aptitude"},
    {"code": "COMM", "name": "Communication", "description": "Written and verbal technical communication and collaboration"},
    {"code": "AI", "name": "Artificial Intelligence", "description": "Machine learning, deep learning, NLP, and modern generative AI"},
    {"code": "CLOUD", "name": "Cloud & DevOps", "description": "Cloud infrastructure (AWS/Azure/GCP), Docker, CI/CD, Kubernetes"},
    {"code": "SQL", "name": "SQL & Databases", "description": "Relational databases, SQL queries, indexing, and data models"},
    {"code": "SWE", "name": "Software Engineering", "description": "Testing, Git version control, SDLC, code review, and Agile practices"},
    {"code": "SYSD", "name": "System Design", "description": "Distributed systems, scalability, microservices, and system architecture"},
    {"code": "NETW", "name": "Networking", "description": "Computer networking, TCP/IP, HTTP protocols, DNS, and gRPC"},
    {"code": "OS", "name": "Operating Systems", "description": "Linux/Unix, concurrency, multithreading, and OS internals"},
    {"code": "OTHER", "name": "Other Skills", "description": "Domain-specific competencies not classified above"}
]


def _infer_company_and_role(filename: str, text: str, user_comp: Optional[str], user_role: Optional[str]):
    """Heuristically extracts company and role if defaults or placeholders were passed."""
    company = user_comp.strip() if user_comp and user_comp.strip() and user_comp.strip() not in ("Job Listing", "Unknown Company") else ""
    role = user_role.strip() if user_role and user_role.strip() and user_role.strip() not in ("Open Role", "Job Role") else ""

    clean_fn = Path(filename).stem
    if " - " in clean_fn:
        parts = clean_fn.split(" - ", 1)
        if not company:
            company = parts[0].strip()
        if not role:
            role = parts[1].strip()

    # Look for common header patterns in the first 500 characters
    head = text[:500]
    if not company:
        m = re.search(r"(?:Company|Employer|Organization)\s*:\s*([^\n\r,]+)", head, re.I)
        if m:
            company = m.group(1).strip()
    if not role:
        m = re.search(r"(?:Role|Title|Position)\s*:\s*([^\n\r,]+)", head, re.I)
        if m:
            role = m.group(1).strip()

    # Fallbacks if still not detected
    if not company:
        company = "Job Listing"
    if not role:
        role = "Software Engineer"

    return company, role


@app.get("/", tags=["General"])
def root():
    return {
        "service": "RADIX JD Analytics API",
        "status": "online",
        "version": "2.1.0",
        "port": 8001,
        "endpoints": {
            "health": "/health",
            "list": "GET /jd-analytics/list (or GET /jd-analytics)",
            "get_by_id": "GET /jd-analytics/{jd_id}",
            "extract": "POST /jd-analytics/extract (multipart upload: PDF, Word DOCX/DOC, TXT, MD)",
            "extract_json": "POST /jd-analytics/extract-json (POST JSON)",
            "categories": "GET /jd-analytics/categories",
            "delete": "DELETE /jd-analytics/{jd_id}"
        }
    }


@app.get("/health", tags=["General"])
def health_check():
    """Health probe endpoint used by the master frontend status strip and Docker."""
    return {
        "status": "ok",
        "service": "jd_analytics",
        "port": 8001,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/jd-analytics", tags=["JD Analytics"])
@app.get("/jd-analytics/list", tags=["JD Analytics"])
def list_analyzed_jds():
    """
    Returns all real analyzed job descriptions submitted by users.
    No artificial mock data: returns empty list if no JDs have been uploaded yet.
    """
    return get_all_jobs()


@app.get("/jd-analytics/samples", tags=["JD Analytics"])
def list_samples_alias():
    """Compatibility alias returning currently stored analyzed JDs."""
    return get_all_jobs()


@app.get("/jd-analytics/categories", tags=["JD Analytics"])
def get_categories():
    """Returns the 12 official RADIX skill categories and taxonomy descriptions."""
    return RADIX_CATEGORIES


@app.get("/jd-analytics/{jd_id}", response_model=ExtractedSkillListResponse, tags=["JD Analytics"])
def get_single_jd(jd_id: str):
    """Retrieves a specific analyzed job description by its unique ID."""
    job = get_job_by_id(jd_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job Description with ID '{jd_id}' not found.")
    return ExtractedSkillListResponse(**job)


@app.delete("/jd-analytics/{jd_id}", tags=["JD Analytics"])
def remove_jd(jd_id: str):
    """Deletes an analyzed job description by ID."""
    success = delete_job(jd_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Job Description with ID '{jd_id}' not found.")
    return {"status": "deleted", "id": jd_id}


@app.post("/jd-analytics/extract", response_model=ExtractedSkillListResponse, tags=["JD Analytics"])
async def extract_jd(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    company: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    sample_id: Optional[str] = Form(None)
):
    """
    Extracts and maps skills from an uploaded job description file
    (multiple supported formats: PDF, Word DOCX/DOC, TXT, MD, RTF, JSON)
    or directly from raw pasted text, and persists it for instant access via GET.
    """
    # If a specific stored JD ID was requested for retrieval, return it
    if sample_id:
        existing = get_job_by_id(sample_id)
        if existing:
            return ExtractedSkillListResponse(**existing)

    source_filename = "Job_Description.txt"
    text_content = ""

    # 1. Extract from uploaded file if present and non-empty
    if file is not None and file.filename:
        source_filename = file.filename
        file_bytes = await file.read()

        if len(file_bytes) > 0:
            if len(file_bytes) > 15 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Job description file exceeds the 15 MB limit."
                )
            try:
                text_content = extract_text(source_filename, file_bytes)
            except Exception as exc:
                # If file extraction failed, check if raw_text was provided as fallback
                if raw_text and raw_text.strip():
                    text_content = raw_text.strip()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to read file '{source_filename}': {exc}"
                    )
        elif raw_text and raw_text.strip():
            # Client passed empty file object but filled raw_text
            text_content = raw_text.strip()
    elif raw_text and raw_text.strip():
        text_content = raw_text.strip()

    # 2. Validate that readable text was obtained
    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid job description via file upload (PDF, Word, TXT, MD) or plain text."
        )

    # 3. Infer company and role
    inferred_company, inferred_role = _infer_company_and_role(
        source_filename, text_content, company, role
    )

    # 4. Extract skills via Groq LLM with fallback
    analysis = analyze_job_description(text_content)

    final_company = inferred_company
    final_role = inferred_role
    final_location = location or "Not specified"

    skills_output = [s.model_dump() for s in analysis.skills]
    required_techs = [s["skill_name"] for s in skills_output]
    summary_text = (
        f"{final_role} at {final_company}. Identified {len(skills_output)} key competencies across RADIX categories."
    )

    unique_id = f"jd-{uuid.uuid4().hex[:8]}"

    response_data = {
        "id": unique_id,
        "source_type": "jd",
        "source_file": source_filename,
        "company": final_company,
        "role": final_role,
        "location": final_location,
        "summary": summary_text,
        "skills": skills_output,
        "required_technologies": required_techs,
        "raw_text": text_content,
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }

    # 5. Persist real user JD in storage so it is immediately accessible via GET
    saved_record = save_job(response_data)

    return ExtractedSkillListResponse(**saved_record)


@app.post("/jd-analytics/extract-json", response_model=ExtractedSkillListResponse, tags=["JD Analytics"])
async def extract_jd_json(req: TextAnalysisRequest):
    """JSON API endpoint for programmatic skill extraction and persistence."""
    return await extract_jd(
        file=None,
        raw_text=req.raw_text,
        company=req.company,
        role=req.role,
        location=req.location,
        sample_id=req.sample_id
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)
