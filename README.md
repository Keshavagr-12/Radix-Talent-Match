# RADIX Talent Match — Integrated AI Candidate Readiness & Skill Matching Platform

Production-grade unified application integrating **5 FastAPI Python microservices** and **1 React + Vite frontend** developed for the **RADIX Talent Match Hackathon**.

The platform evaluates candidates across the 12 canonical RADIX competency categories:  
`COD` (Coding), `DSA` (Data Structures & Algorithms), `OOD` (Object-Oriented Design), `APTI` (Aptitude), `COMM` (Communication), `AI` (Artificial Intelligence), `CLOUD` (Cloud Computing), `SQL` (Databases & SQL), `SWE` (Software Engineering), `SYSD` (System Design), `NETW` (Networking), `OS` (Operating Systems), plus `OTHER`.

---

## 1. Five Modules Overview

1. **Module 01: JD Analytics (Port 8001):** Analyzes Job Descriptions (PDF, DOCX, or text) using LLM / NLP pipelines to extract required technical skills mapped to the 12 RADIX categories.
2. **Module 02: Resume Parsing (Port 8002):** Extracts structured candidate skills, education, projects, internships, hackathons, and certifications from resumes.
3. **Module 03: Profile Builder (Port 8003):** Manages complete candidate profiles with 1–10 proficiency sliders, CV storage, and database persistence (Supabase + local cache).
4. **Module 04: Talent Check (Port 8004):** Performs benchmark readiness scoring and gap analysis against Tier-1 enterprise bars (Google LLC, Microsoft Corporation, Oracle Financial Services Software).
5. **Module 05: Skill Matching (Port 8005):** Compares candidate profiles directly against specific job postings to generate match scores, matched skills, partial category matches, and actionable missing-skill gap lists.

---

## 2. Mandatory End-to-End Workflow

```text
              MASTER FRONTEND (Port 5173)
                         |
                         v
                    1. JD MODULE (Port 8001)
                         |
                         v
             2. RESUME PARSING (Port 8002)
                         |
                         v
             3. PROFILE BUILDER (Port 8003)
                         |
                         v
               4. TALENT CHECK (Port 8004)
                         |
                         v
              5. SKILL MATCHING (Port 8005)
                         |
                         v
                   FINAL RESULTS VIEW
```

---

## 3. Directory Layout

```text
Radix_talent_match/
├── jd_analytics/
│   └── module 1/
│       ├── api.py                    # FastAPI entry point (Port 8001)
│       ├── analyzer.py               # Groq LLM extraction pipeline
│       ├── extractor.py              # PDF/DOCX document text extractor
│       ├── schemas.py                # Pydantic schemas
│       ├── prompts.py                # System extraction prompt
│       ├── .env.example
│       └── requirements.txt
├── resume-parsing-llm/
│   ├── app/
│   │   ├── main.py                   # FastAPI entry point (Port 8002)
│   │   └── __init__.py
│   ├── .env.example
│   └── requirements.txt
├── profile_builder/
│   └── backend/
│       ├── main.py                   # FastAPI entry point (Port 8003)
│       ├── app/
│       │   ├── routes/profile_routes.py
│       │   ├── schemas/profile_schema.py
│       │   ├── services/profile_service.py
│       │   └── services/supabase_service.py
│       ├── .env.example
│       └── requirements.txt
├── Talent-match/
│   └── backend/
│       ├── main.py                   # FastAPI entry point (Port 8004)
│       ├── api/talent_check_router.py
│       ├── core/readiness_service.py
│       ├── core/scoring_engine.py
│       ├── core/gap_analyzer.py
│       ├── data/company_skillsets.json
│       ├── .env.example
│       └── requirements.txt
├── skill_matching/
│   ├── main.py                       # FastAPI entry point (Port 8005)
│   ├── .env.example
│   └── requirements.txt
├── radix-talent-match_frontend/
│   ├── src/
│   │   ├── services/api/             # Reusable microservice client layer
│   │   │   ├── client.ts             # HTTP client with timeouts & error handling
│   │   │   ├── backendRegistry.ts    # Service health probe & port discovery
│   │   │   ├── jd.api.ts             # Module 1 client
│   │   │   ├── resumeParsing.api.ts  # Module 2 client
│   │   │   ├── profileBuilder.api.ts # Module 3 client
│   │   │   ├── talentCheck.api.ts    # Module 4 client
│   │   │   └── skillMatching.api.ts  # Module 5 client
│   │   ├── components/layout/BackendServiceStatusStrip.tsx # Live service health pills
│   │   ├── context/WorkspaceContext.tsx
│   │   ├── features/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── scripts/
│   ├── start-all.ps1                 # Windows 11 one-click launcher
│   └── stop-all.ps1                  # Clean process terminator
├── tests/
│   └── integration/
│       └── test_end_to_end.py        # Automated test suite (12 tests)
├── INTEGRATION_AUDIT.md              # Initial inspection audit
├── INTEGRATION_MAP.md                # Real API contracts and routing map
├── TEST_REPORT.md                    # Verification test report
└── README.md
```

---

## 4. Prerequisites

- **OS:** Windows 10 / 11 (PowerShell 5.1 or 7+)
- **Python:** Python 3.10+ (tested on Python 3.13)
- **Node.js:** Node.js v18+ (tested on Node.js v22) & npm

---

## 5. Installation & Setup

### 5.1 Python Dependencies
Install dependencies for all 5 backend modules:

```powershell
# In the project root:
pip install fastapi uvicorn pydantic python-dotenv pymupdf pypdf python-docx python-multipart requests supabase
```

### 5.2 Frontend Dependencies
Install React packages:

```powershell
cd radix-talent-match_frontend
npm install --legacy-peer-deps
cd ..
```

---

## 6. One-Click Launch (Recommended)

To start all 5 FastAPI services and the Vite frontend with one command:

```powershell
.\scripts\start-all.ps1
```

To view services in individual terminal windows for debugging logs:

```powershell
.\scripts\start-all.ps1 -VisibleWindows
```

To stop all services cleanly:

```powershell
.\scripts\stop-all.ps1
```

---

## 7. Individual Service Startup Commands

If you prefer running modules in separate terminal tabs:

| Service | Port | Directory | Startup Command | Interactive Docs |
|---|:---:|---|---|---|
| **JD Analytics** | `8001` | `jd_analytics` | `python -m uvicorn api:app --host 127.0.0.1 --port 8001 --reload` | [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs) |
| **Resume Parsing** | `8002` | `resume-parsing-llm` | `python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload` | [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs) |
| **Profile Builder** | `8003` | `profile_builder\backend` | `python -m uvicorn main:app --host 127.0.0.1 --port 8003 --reload` | [http://127.0.0.1:8003/docs](http://127.0.0.1:8003/docs) |
| **Talent Check** | `8004` | `Talent-match\backend` | `python -m uvicorn main:app --host 127.0.0.1 --port 8004 --reload` | [http://127.0.0.1:8004/docs](http://127.0.0.1:8004/docs) |
| **Skill Matching** | `8005` | `skill_matching` | `python -m uvicorn main:app --host 127.0.0.1 --port 8005 --reload` | [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs) |
| **Master Frontend** | `5173` | `radix-talent-match_frontend` | `npm run dev` | [http://localhost:5173](http://localhost:5173) |

---

## 8. Running Automated Tests

Run the complete integration suite:

```powershell
pytest tests/integration/test_end_to_end.py -v -s
```

All 12 test cases verify health endpoints, individual module contracts, and the complete 5-stage sequential flow.

---

## 9. Production Build

To build the frontend bundle for production deployment:

```powershell
cd radix-talent-match_frontend
npm run build
```

Production artifacts will be generated in `radix-talent-match_frontend/dist/`.

---

## 10. External Credentials & Resilience

- **Groq API Key (`GROQ_API_KEY`):** Placed in `jd_analytics/.env` for LLM extraction. If unavailable or rate-limited, the service automatically falls back to the internal rule-based keyword & category extractor without failing.
- **Supabase Cloud (`SUPABASE_URL`, `SUPABASE_KEY`):** Placed in `profile_builder/backend/.env`. If Supabase is unreachable or unconfigured, profiles automatically persist into the local cache (`sample-data/local_profiles_cache.json`).
