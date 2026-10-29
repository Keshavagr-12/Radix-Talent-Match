# RADIX Resume Parsing Microservice

**Port: 8002**  
Part of the RADIX Talent Match Platform.

## Features
- **Multi-Format Extraction:** Automatically extracts clean text from `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.rtf`, `.html`, and `.json` resumes.
- **12 RADIX Categories:** Intelligently identifies and maps candidate technical competencies into the official RADIX framework:
  `COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`.
- **Comprehensive Candidate Modeling:** Extracts structured Education, Projects, Internships/Experience, Hackathons, and Certifications.
- **Dual Engine Analysis:** Primary parsing powered by Groq LLM with strict structured JSON schema; automatic fallback to deterministic rule-based regex and keyword analysis.
- **Zero Mock Seeding:** Storage starts empty (`data/resumes.json`) and strictly persists real user-uploaded resumes.
- **RESTful Endpoints:**
  - `GET /health` — Service health check.
  - `POST /resume-parsing/extract` — Upload resume document (.pdf, .docx, .doc, .txt, .md) or submit form data.
  - `POST /resume-parsing/extract-text` — Submit JSON payload with raw resume text.
  - `GET /resume-parsing/samples` & `GET /resume-parsing/list` — Retrieve list of all saved parsed resumes.
  - `GET /resume-parsing/{candidate_id}` — Retrieve a specific resume by ID.
  - `DELETE /resume-parsing/{candidate_id}` — Delete a specific resume by ID.
  - `DELETE /resume-parsing` — Clear all stored resumes.

## Quick Start

### 1. Run the FastAPI Microservice (Port 8002)
```bash
# Install dependencies
pip install -r requirements.txt

# Run the API
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002
```

### 2. Run the Standalone Streamlit App
To test and inspect resume parsing individually in a browser UI:
```bash
streamlit run streamlit_app.py
```
