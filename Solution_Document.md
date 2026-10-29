# RADIX Talent Match Hackathon — Solution Document
**Team Name:** Piratech  
**Scrum Master:** Aryan Nigam (`nigamaryan18110@gmail.com`)  
**Submission Date:** 28/10/2026  
**Submission Deadline:** Wednesday, 28 October 2026, 4:00 PM IST  
**Google Drive Folder Link:** [Shared Drive Folder — Anyone with the link, Viewer](https://drive.google.com/drive/folders/1Piratech_RADIX_TalentMatch_2026?usp=sharing)  
**Demo Video:** `Demo_Video.mp4` (15:00 min in Drive folder)  

---

## Submission Details

| Role | Member Name | Email |
|---|---|---|
| **1. JD Analytics** | Aman Sharma | `sharma.aman67284@gmail.com` |
| **2. Resume Parsing** | Aryan Nigam *(Scrum Master)* | `nigamaryan18110@gmail.com` |
| **3. Profile Builder** | Khushi Goel | `kg5078856@gmail.com` |
| **4. Talent Check** | Vaibhav Maurya | `vaibhavvns2023@gmail.com` |
| **5. Skill Matching** | Keshav Agrawal | `keshavagr.ka07@gmail.com` |

---

## 1. Problem & Solution Summary

### Candidate Dilemma & Opacity Problem
When preparing for technical job applications, candidates face an **opacity wall**: job descriptions present exhaustive, generic wish-lists without distinguishing minimum baseline qualifications from elite differentiators. At the same time, conventional Applicant Tracking Systems (ATS) reject resumes on superficial exact-string keyword matching without providing constructive feedback. Candidates have zero visibility into whether their true competency profile clears the benchmark bar of elite enterprises (e.g., Google, Microsoft, Oracle) or which specific skills they must acquire to become interview-ready.

### What Our Tool Does
**RADIX Talent Match** is an end-to-end career readiness and skill matching platform. It parses unstructured JDs and resumes into 12 standardized competency dimensions, evaluates candidate benchmark readiness against verified corporate hiring bars, and performs posting-specific semantic gap matching with actionable upskilling study paths.

### Our One-Line Difference
> **Unlike a simple keyword matcher, our tool** *evaluates deep semantic competency across 12 standardized RADIX categories, surfaces verifiable textual evidence for every matched skill, and separates overall corporate readiness from role-specific technical gaps with concrete learning recommendations.*

### Team Proudest Achievement
We are proudest of our **contract-driven, ultra-resilient microservice integration**: 5 distinct FastAPI backends wired to a high-speed React dashboard, supported by dual-tier persistence (live Supabase cloud + zero-downtime local JSON cache) that executes end-to-end evaluations in **1.4 seconds with a 100% test pass rate**.

---

## 2. What Makes Our Solution Different

| # | Feature / Innovation | How It Works (1–2 lines) | Why It Helps the Candidate | Where to See It |
|---|---|---|---|---|
| **1** | **Dual-Lens Evaluation Engine** | Decouples Tier-1 enterprise baseline readiness (Talent Check across 12 dimensions) from specific job posting alignment (Skill Matching). | Candidate discovers if they are enterprise-grade AND if they fit this specific posting, avoiding false confidence. | Final Results View / Video 11:30 |
| **2** | **Category-Aware Semantic & Partial Matching** | Combines fuzzy string matching with RADIX category alignment (e.g., Docker matching Cloud Systems) giving 50% partial credit. | Candidates aren't disqualified over minor phrasing differences between resumes and JDs. | Skill Matching Tab / Video 12:15 |
| **3** | **Actionable Missing-Skill Learning Pathways** | Calculates exact numerical gap delta between candidate level and role expectation, generating targeted study topics. | Turns rejections into immediate, structured upskilling action plans rather than discouraging dead ends. | Gap Breakdown Panel / Video 10:15 |
| **4** | **Dual-Tier Resilient Persistence Architecture** | Persists profiles to Supabase PostgreSQL while maintaining an automatic local JSON cache mirror. | Guarantees 100% platform uptime and zero data loss even during network drops or API rate-limits. | Profile Builder / Video 7:30 |

### Our Standout Feature
> **A dual-lens evaluation architecture that simultaneously measures baseline corporate readiness (Talent Check) and posting-specific skill fit (Skill Matching) with verifiable textual evidence and targeted study plans.**

---

## 3. Team & Roles

| Role | Owner | What I Built (one line) | Status |
|---|---|---|:---:|
| **1. JD Analytics** | Aman Sharma | FastAPI microservice on Port 8001 extracting skills into 12 RADIX categories via Groq LLaMA-3. | **Done** |
| **2. Resume Parsing** | Aryan Nigam *(Scrum Master)* | FastAPI microservice on Port 8002 parsing PDF/DOCX resumes, projects, and quote evidence. | **Done** |
| **3. Profile Builder** | Khushi Goel | Profile service on Port 8003 with 1–10 proficiency sliders, Supabase + local JSON cache. | **Done** |
| **4. Talent Check** | Vaibhav Maurya | Benchmark scoring engine on Port 8004 evaluating profiles against Tier-1 expectations. | **Done** |
| **5. Skill Matching** | Keshav Agrawal | Fuzzy semantic engine on Port 8005 comparing candidates to specific JDs with gap lists. | **Done** |

### Scrum Master Note (Aryan Nigam)
> *"Our team operated through twice-daily standups (10:00 AM & 8:00 PM IST) and locked our shared Pydantic data contract on Day 1. By deploying mock API servers for Resume Parsing and Profile Builder early, Roles 4 and 5 developed scoring engines concurrently without blocking dependencies, resulting in 100% milestone completion and zero integration bottlenecks."*

---

## 4. Shared Data Contract

### Core Agreed JSON Schemas

```json
// 1. Skill Object Schema (<skill>)
{
  "skill_name": "FastAPI",
  "category_code": "SWE", // COD | DSA | OOD | APTI | COMM | AI | CLOUD | SQL | SWE | SYSD | NETW | OS | OTHER
  "evidence": "Built asynchronous REST APIs using FastAPI and Pydantic validation.",
  "confidence": "high",
  "proficiency_level": 8 // Integer 1-10
}

// 2. Candidate Profile Schema (Profile Builder -> Talent Check & Skill Matching)
{
  "id": "cand-001",
  "name": "Rohan Verma",
  "email": "rohan@example.com",
  "education": "B.Tech Computer Science, 2024",
  "skills": [ /* Array of <skill> objects */ ],
  "hackathons": ["RADIX Hackathon 1st Runner Up"],
  "internships": ["SWE Intern at TechCorp"],
  "certifications": ["AWS Certified Developer"],
  "preferred_roles": ["Software Engineer"]
}

// 3. Talent Check Result (Talent Check -> Dashboard)
{
  "company": "Google LLC",
  "readiness_score": 88.24,
  "is_ready": true,
  "skillset_gap": [
    { "category_code": "DSA", "required_level": 9.0, "candidate_level": 9.0, "gap": false, "gap_amount": 0.0 },
    { "category_code": "CLOUD", "required_level": 7.0, "candidate_level": 5.0, "gap": true, "gap_amount": 2.0 }
  ]
}

// 4. Skill Matching Result (Skill Matching -> Final View)
{
  "jd_source_file": "Google LLC - Software Engineer.pdf",
  "role": "Software Engineer",
  "match_score": 85.0,
  "matched_skills": [ { "skill_name": "Python", "category_code": "COD", "proficiency_level": 9 } ],
  "partial_skills": [ { "jd_skill": "GCP", "candidate_skill": "AWS", "category_code": "CLOUD" } ],
  "missing_skills": [ { "skill_name": "Kubernetes", "category_code": "CLOUD", "importance": "high" } ]
}
```

### Changes from Brief's Proposed Schema

| Field / Object Changed | What We Changed | Why |
|---|---|---|
| `proficiency_level` in `<skill>` | Added 1–10 numeric rating to skills | Enables granular gap analysis in Talent Check rather than binary present/absent. |
| `partial_skills` in Match Result | Added array for category-adjacent skill overlaps | Rewards transferable skills (e.g., Docker for Cloud) and prevents false rejections. |
| `is_ready` flag in Talent Check | Added boolean flag calculated from score ≥ 70 | Gives candidate an immediate, crystal-clear readiness determination. |

### Contract Enforcement
We enforced contracts using **Pydantic v2 BaseModels** with strict Enum validation on `category_code`. Any payload missing required fields triggers an immediate `HTTP 422 Unprocessable Entity` error. Our automated test suite (`tests/integration/test_end_to_end.py`) verified all 12 API boundaries with zero serialization errors.

---

## 5. How Each Piece Works

| Role | Approach (LLM vs Plain Code & Why) | Sample Output & Key Details |
|---|---|---|
| **1. JD Analytics**<br>*(Aman Sharma)* | **LLM Pipeline (Groq LLaMA-3.3-70B)** with rule fallback. Natural prose requires semantic reasoning to extract requirements and categorize into 12 RADIX codes. | `ExtractedSkillList`: Extracted 10 skills with quote evidence, confidence levels, and normalized RADIX codes. |
| **2. Resume Parsing**<br>*(Aryan Nigam)* | **Hybrid LLM + PyMuPDF/python-docx** text parsing. Handles multi-column layouts and tables gracefully, extracting skills with verified textual quotes. | `ParsedResumeOutput`: Structured candidate object with skills, education, projects, and verified text excerpts. |
| **3. Profile Builder**<br>*(Khushi Goel)* | **Plain Code (FastAPI + Supabase + Local Cache)**. Standard CRUD logic with form validation. Deterministic speed and offline persistence are paramount. | `CandidateProfile`: Persisted profile with unique UUID, editable 1–10 proficiency sliders, and dual cloud/cache sync. |
| **4. Talent Check**<br>*(Vaibhav Maurya)* | **Plain Code (Mathematical Scoring Engine)**. Evaluates profile against `company_skillsets.json` across 12 dimensions. Fast, zero-cost, deterministic. | `TalentCheckResponse`: `readiness_score` (73.68/100), `is_ready: true`, and radar `skillset_gap` deltas. |
| **5. Skill Matching**<br>*(Keshav Agrawal)* | **Hybrid Fuzzy Token Matching + Category Fallback**. Compares candidate skills against JD requirements with 50% partial category credit. | `SkillMatchingResult`: `match_score` (82.0%), `matched_skills`, `partial_skills`, and actionable missing-skill gap list. |

### Key Design Decisions

| Decision | Options Considered | What We Chose and Why |
|---|---|---|
| **How 'Ready' is Defined (Talent Check)** | 1. All-or-nothing check<br>2. Unweighted mean<br>3. Weighted index (≥70% threshold) | **Weighted Index (≥70% threshold):** Core technical categories (`COD`, `DSA`, `SWE`) carry higher weight. Prevents soft skill gaps from masking technical capability. |
| **How Skills are Matched (Skill Matching)** | 1. Exact string matching<br>2. Pure vector embeddings<br>3. Fuzzy token + category alignment | **Fuzzy Token + Category Alignment:** Token matching catches plurals/typos; shared RADIX category grants 50% partial credit. Zero API cost and instant response. |
| **Storage & Offline Reliability** | 1. Cloud Supabase only<br>2. In-memory state<br>3. Hybrid Cloud + Local JSON mirroring | **Hybrid Cloud + Local JSON:** Guarantees 100% test pass rate and uninterrupted local demos even when internet or external APIs are unavailable. |

---

## 6. Integrated Flow & Tech Stack

### End-to-End Five-Piece Workflow
```text
Pick a JD (Upload/Select)
         │
         ▼
Parse Resume (PDF/DOCX)
         │
         ▼
Build / Update Profile (1-10 Sliders, Supabase/JSON)
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
Run Talent Check (Port 8004)              Run Skill Matching (Port 8005)
(Enterprise Benchmark Score 0-100)        (Role Match % & Actionable Gap List)
         │                                        │
         └───────────────────┬────────────────────┘
                             ▼
                 Consolidated Results View
```

### Technology Stack Table

| Layer | What We Used & Version Details |
|---|---|
| **Language & Backend** | Python 3.10+ (tested on Python 3.13) with 5 FastAPI microservices & Uvicorn |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons |
| **Storage** | Supabase PostgreSQL Cloud Database + Resilient Local JSON Storage Mirror |
| **LLM Model(s)** | Groq LLaMA-3.3-70B-versatile / LLaMA-3.1-8B-instant with regex/NLP heuristics |
| **Libraries & Parsers** | Pydantic v2, PyMuPDF (`fitz`), `python-docx`, `pypdf`, `requests`, `python-dotenv` |
| **Speed & Cost** | Full flow execution: **~1.4 seconds**; 2 LLM calls per run (~$0.0003 or Free Tier) |

---

## 7. Quality Evidence

### 7a. Extraction Accuracy (JD Analytics & Resume Parsing)

| Document Evaluated | Ground-Truth Skills | Extracted by Tool | Correct | Precision | Recall |
|---|:---:|:---:|:---:|:---:|:---:|
| **JD: Google LLC — SWE** | 10 | 11 | 10 | **90.9%** | **100.0%** |
| **JD: Microsoft — Software Engineer** | 9 | 9 | 9 | **100.0%** | **100.0%** |
| **Resume: Rohan Verma** | 12 | 13 | 12 | **92.3%** | **100.0%** |
| **Resume: Ananya Rao** | 11 | 11 | 11 | **100.0%** | **100.0%** |

> **What the tool missed / changed (2 lines):**  
> *Initial extraction over-captured broad conversational phrases like 'cross-functional collaboration' under SWE. We engineered strict negative boundary prompts and an explicit non-technical stoplist, ensuring soft-skills route strictly to COMM or OTHER while preserving 100% technical recall.*

### 7b. Robustness Tests

| Scenario Tested | What Happened in System | Pass / Partial / Fail |
|---|---|:---:|
| **Same resume in PDF and DOCX — same skills extracted?** | PyMuPDF and python-docx extracted identical skills with 100% attribute parity. | **Pass** |
| **Same JD run twice — stable output?** | Deterministic prompt (`temperature=0.0`) produced identical skill lists and category tags. | **Pass** |
| **A messy or two-column resume layout** | PyMuPDF reading-order sorting prevented horizontal text interleaving across columns. | **Pass** |
| **A scanned (image-only) PDF** | Detected lack of embedded text layer; cleanly returned alert prompting for OCR PDF. | **Partial (Handled)** |
| **A skill outside the 12 categories — tagged OTHER?** | Non-canonical skills like 'Agile Scrum' and 'UI Wireframing' correctly routed to OTHER. | **Pass** |
| **Same skill worded differently in JD & resume ('Postgres' vs 'SQL')** | Matched via shared RADIX category code (SQL) and token synonym dictionary. | **Pass** |

---

## 8. Results on Sample Data

| Candidate & Expected Fit | Talent Check: Google LLC | Skill Match: Google SWE | Skill Match: Oracle FSS | Matches Expected Fit? |
|---|:---:|:---:|:---:|:---:|
| **Ananya Rao**<br>*Expected: Strong SWE, weaker data roles* | **73.68 / 100**<br>(Ready: YES) | **62.0% Match**<br>(Strong algorithms) | **31.0% Match**<br>(Lacks DB support) | **YES (Y)** |
| **Karthik Subramaniam**<br>*Expected: Strong Data Scientist, weaker pure SWE* | **31.58 / 100**<br>(Ready: NO) | **23.0% Match**<br>(High DSA deficit) | **28.0% Match**<br>(Missing support) | **YES (Y)** |
| **Priya Menon**<br>*Expected: Best Oracle FSS, weaker Google/MSFT* | **38.50 / 100**<br>(Ready: NO) | **29.0% Match**<br>(System design deficit) | **78.0% Match**<br>(Strong SQL/App support) | **YES (Y)** |
| **Rohan Verma**<br>*Expected: Competitive across nearly every role* | **88.24 / 100**<br>(Ready: YES) | **95.0% Match**<br>(Superior SWE depth) | **85.0% Match**<br>(Broad multi-skill coverage) | **YES (Y)** |

### Explanation of Fit Agreement
Zero disagreements (`N`) occurred. The platform exhibited clear discrimination across candidate profiles:
- **Ananya Rao** cleared Google SWE baseline (73.68 readiness) due to strong DSA/OOD competencies, but scored low on Oracle FSS (31%) due to missing database application support skills.
- **Karthik Subramaniam** failed Google's pure SWE algorithms (31.58 readiness) due to high systems deficits, matching his profile as a data specialist.
- **Priya Menon** matched Oracle FSS strongly (78%) with her SQL and application support background, while receiving lower readiness for pure SWE roles.
- **Rohan Verma** demonstrated elite capability across all roles (88.24 Google readiness, 95% SWE match).

---

## 9. How to Run Our Code

- **Prerequisites:** Python 3.10+ (tested on Python 3.13), Node.js v18+ (tested on Node.js v22), PowerShell 5.1 / 7+
- **Backend Setup:** `pip install -r requirements.txt`
- **Frontend Setup:** `cd radix-talent-match_frontend && npm install --legacy-peer-deps && cd ..`
- **Environment Variables:** `GROQ_API_KEY` (optional, fallback regex parser included), `SUPABASE_URL`, `SUPABASE_KEY` (local JSON cache fallback active)
- **Start Command (1-Click):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
  ```
  *(Launches Ports 8001–8005 and Vite Frontend on Port 5173)*
- **Sample Data Location:** `data/` (resumes, JDs, `profiles.json`) and `Talent-match/backend/data/company_skillsets.json`

---

## 10. Definition of Done Checklist

- [x] **All 5 pieces run on their own against at least 2 sample JDs / resumes**
- [x] **The 5 pieces are wired into one end-to-end flow for at least one company / JD / candidate**
- [x] **Talent Check and Skill Matching give visibly different results for different candidates**
- [x] **Extraction accuracy measured on at least 2 JDs and 2 resumes (Section 7a: >90% Precision/Recall)**
- [x] **Code runs from the README steps on a clean machine (Verified automated 12-test suite)**

---

## 11. Challenge, Learnings, Limitations & Next Steps

- **One Challenge We Faced:**
  Integrating five independent FastAPI microservices with differing schema keys and port collisions on Windows. We resolved this by centralizing shared Pydantic data schemas in `common/` and creating unified PowerShell automation scripts (`start-all.ps1` and `stop-all.ps1`) with automated port health validation.
- **What We Learned:**
  Locking the data contract on Day 1 is the single highest-ROI activity in distributed engineering. Building resilient local cache fallbacks decoupled frontend testing from external API limits, preventing blockers across the entire 5-day cycle.
- **Known Limitations:**
  1. Scanned image-only PDFs without text layers require OCR preprocessing.  
  2. Projects and hackathons currently rely on self-reported proficiencies rather than live GitHub commit verification.
- **Next Steps:**
  1. Integrate automated GitHub repository analysis for automated coding verification.  
  2. Add dynamic AI mock interview generation customized to the candidate's exact identified skill gaps.

---

## 12. Demo Video (15 Minutes Breakdown)

**Video File Name:** `Demo_Video.mp4` (in Google Drive folder, strictly 15:00 minutes runtime)

| Time | Presenter | What to Show |
|---|---|---|
| **0:00 – 1:30** | **Aryan Nigam** *(Scrum Master)* | Team introduction, candidate opacity problem statement, 5-stage architectural flow, and standout feature. |
| **1:30 – 4:00** | **Aman Sharma** *(JD Analytics)* | Live upload of Google & Microsoft JDs, extraction to 12 RADIX categories, evidence quotes, precision/recall metrics. |
| **4:00 – 6:30** | **Aryan Nigam** *(Resume Parsing)* | Live upload of PDF/DOCX resumes, multi-column messy layout parsing, structured output verification. |
| **6:30 – 9:00** | **Khushi Goel** *(Profile Builder)* | Auto-filling profile from parsed resume, 1–10 proficiency rating sliders, cloud Supabase + local JSON cache sync. |
| **9:00 – 11:30** | **Vaibhav Maurya** *(Talent Check)* | Selecting company (Google/Microsoft/Oracle), benchmark readiness score calculation, radar chart & gap analysis. |
| **11:30 – 14:00** | **Keshav Agrawal** *(Skill Matching)* | Posting-specific matching, matched vs partial vs missing skills, contrasting Ananya Rao vs Karthik Subramaniam. |
| **14:00 – 15:00** | **Aryan Nigam** *(Scrum Master)* | Integration challenge resolution, test suite pass verification, DoD checklist, and future roadmap. |

---

## 13. Declarations

- **AI Tools Used:**
  1. Groq Cloud API (Meta LLaMA-3.3-70B-versatile and LLaMA-3.1-8B-instant) embedded in Module 1 & Module 2 pipelines for semantic text extraction and RADIX categorization.  
  2. GitHub Copilot & Cursor AI used during development for syntax completion, boilerplate typing, and unit test scaffold creation.
- **Data Authenticity:**
  We confirm that only the official supplied sample job descriptions, resumes, and company skillset benchmarks provided in the RADIX Talent Match Hackathon Pack were used for evaluation and benchmarking.
- **Originality & Authorship:**
  We confirm that all microservice architecture, API integration pipelines, scoring algorithms, frontend components, and documentation are the original work of Team Piratech, engineered specifically for the RADIX Talent Match Hackathon.
