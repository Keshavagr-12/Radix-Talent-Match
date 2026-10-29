# INTEGRATION AUDIT REPORT — RADIX TALENT MATCH
**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Integration Architect  
**Project Root:** `C:\Users\kesha\OneDrive\Desktop\Radix_talent_match`

---

## 1. Executive Summary

This audit documents the state of all folders in the workspace prior to unified integration. The workspace hosts the **RADIX Talent Match** platform developed for the RADIX Talent Match Hackathon. The platform enables candidate readiness evaluation across 12 canonical RADIX skill categories (`COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`, plus `OTHER`).

The mandatory workflow is:
$$\text{JD} \longrightarrow \text{Resume Parsing} \longrightarrow \text{Profile Builder} \longrightarrow \text{Talent Check} \longrightarrow \text{Skill Matching} \longrightarrow \text{Final Results}$$

---

## 2. Discovered Folder Structure

| Canonical Module Name | Discovered Folder Path | Type | Current Status |
|---|---|---|---|
| **Module 1: JD Analytics** | `jd_analytics` | Python (Groq/Pydantic/FastAPI/Streamlit) | Complete LLM & text extractor code; professional standalone FastAPI microservice on Port 8001 |
| **Module 2: Resume Parsing** | `resume-parsing-llm/resume-parsing-llm` | Python | Skeleton folder contained empty (0-byte) files; full extraction logic discovered in Profile Builder and test suite |
| **Module 3: Profile Builder** | `profile_builder/backend` | Python FastAPI + Supabase | Functional FastAPI app (`backend/main.py`); requires Supabase credentials, needs local JSON/in-memory fallback |
| **Module 4: Talent Check** | `Talent-match/backend` | Python FastAPI | Functional FastAPI app (`backend/main.py`) with 12-skill gap analyzer and scoring engine |
| **Module 5: Skill Matching** | `skill_matching` | Python FastAPI | Module specifications and data contract fully defined in Hackathon Brief; requires standalone FastAPI backend |
| **Master Frontend** | `radix-talent-match_frontend` | React 19 + TypeScript + Vite + Tailwind | Complete production-quality UI, mock services, comprehensive types, needs live API client layer |

---

## 3. Detailed Audit by Module

### 3.1 Module 1: JD Analytics
- **Path:** `jd_analytics`
- **Primary Files:**
  - `analyzer.py`: Calls Groq LLM (`openai/gpt-oss-20b`) with structured JSON schema (`JobAnalysis`).
  - `extractor.py`: Extracts text from PDF (`pypdf`) and Word (`docx`).
  - `schemas.py`: Pydantic models for `Skill` and `JobAnalysis` mapped to 12 RADIX categories.
  - `prompts.py`: System prompt defining skill boundaries and evidence requirements.
  - `app.py`: Streamlit demonstration app.
  - `main.py`: CLI script.
  - `.env`: Contains `GROQ_API_KEY`.
- **Target Integration:** Wrap analysis logic into FastAPI application exposing `POST /jd-analytics/extract`, `GET /jd-analytics/list`, and `GET /health` running on port **8001**.
- **Dependencies:** `fastapi`, `uvicorn`, `pydantic`, `groq`, `python-dotenv`, `pypdf`, `python-docx`.

### 3.2 Module 2: Resume Parsing
- **Path:** `resume-parsing-llm/resume-parsing-llm`
- **Discovered State:** Empty template files (0 bytes) in downloaded archive.
- **Remediation & Architecture:**
  - Implement full FastAPI application in `resume-parsing-llm` utilizing PDF/DOCX text extraction (`pypdf`, `python-docx`), regex and NLP entity extraction, and Groq LLM classification mapped to the 12 RADIX competency categories.
  - Implement endpoints: `POST /resume-parsing/extract`, `GET /resume-parsing/samples`, `GET /health` running on port **8002**.
  - Output conformant with `ParsedResumeOutput` including `candidate_name`, `email`, `education`, `skills`, `projects`, `internships`, `hackathons`, `certifications`, `preferred_roles`.

### 3.3 Module 3: Profile Builder
- **Path:** `profile_builder/backend`
- **Primary Files:**
  - `main.py`: FastAPI app with CORS middleware.
  - `app/routes/profile_routes.py`: CRUD routes for `/api/profiles`.
  - `app/services/profile_service.py`: Supabase database queries.
  - `app/services/supabase_service.py`: Supabase client loader.
  - `app/services/resume_parser.py`: PDF/DOCX resume text extraction and skill tagging.
- **Port:** Configured on port **8003**.
- **Risk Identified:** Hard dependency on Supabase cloud (`SUPABASE_URL` & `SUPABASE_KEY`).
- **Remediation:** Added resilient offline local JSON fallback in `profile_service.py` so the service functions seamlessly when Supabase is unreachable or unconfigured, while preserving full Supabase support when credentials are valid.

### 3.4 Module 4: Talent Check
- **Path:** `Talent-match/backend`
- **Primary Files:**
  - `main.py`: FastAPI entry point.
  - `api/talent_check_router.py`: Route `POST /talent-check/check`.
  - `core/readiness_service.py`: Orchestrates benchmark loading, gap analysis, and readiness scoring.
  - `core/gap_analyzer.py`: Compares candidate skill levels (1-10) against company bars.
  - `core/scoring_engine.py`: Computes 0-100 readiness score based on gap amounts.
  - `core/benchmark_loader.py`: Loads `company_skillsets.json`.
  - `data/company_skillsets.json`: Benchmark levels for Google, Microsoft, Amazon.
- **Port:** Configured on port **8004**.
- **Enhancement:** Add CORS middleware, `POST /talent-check/evaluate` alias to support frontend contract seamlessly, `GET /talent-check/companies`, and `GET /health`.

### 3.5 Module 5: Skill Matching
- **Path:** `skill_matching`
- **Architecture:** Standalone FastAPI service running on port **8005**.
- **Primary Functionality:**
  - Accepts candidate profile (`CandidateProfile`) and target JD (`ExtractedSkillList`).
  - Performs multi-tier token similarity, synonym mapping, and RADIX category alignment.
  - Computes deterministic match score (0-100).
  - Categorizes skills into `matched_skills`, `missing_skills`, and `partial_skills` (with similarity rationale).
  - Endpoints: `POST /skill-matching/compare`, `GET /health`.

### 3.6 Master Frontend
- **Path:** `radix-talent-match_frontend`
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, React Hook Form, Zod, Sonner.
- **State Management:** `WorkspaceContext.tsx` handles cross-module data persistence in `localStorage`.
- **Existing Integration Layer:** `src/services/api/config.ts` had mock toggle `VITE_USE_MOCK_API`.
- **Planned Integration:**
  - Implement full typed API client layer under `src/services/api/` with individual clients for each module.
  - Update `WorkspaceContext.tsx` to call live backend endpoints when available with graceful fallback to mock mode.
  - Add service health indicators and sequential workflow progression controls.

---

## 4. Port Allocation Matrix

| Service | Protocol | Host | Port | Health Endpoint |
|---|---|---|---|---|
| JD Analytics | HTTP | `127.0.0.1` | **8001** | `GET /health` |
| Resume Parsing | HTTP | `127.0.0.1` | **8002** | `GET /health` |
| Profile Builder | HTTP | `127.0.0.1` | **8003** | `GET /health` |
| Talent Check | HTTP | `127.0.0.1` | **8004** | `GET /health` |
| Skill Matching | HTTP | `127.0.0.1` | **8005** | `GET /health` |
| Master Frontend | HTTP | `localhost` | **5173** | - |

No port conflicts were detected.

---

## 5. Security & Environment Variable Safety

1. Never commit active API keys or secrets to repositories or release archives.
2. Provide sanitized `.env.example` templates for all backends and the frontend.
3. Keep CORS configured to accept `http://localhost:5173`, `http://localhost:3000`, and `http://127.0.0.1:5173`.
4. Implement input validation and file-size guards (max 5 MB) across all file upload endpoints.
