# INTEGRATION MAP — RADIX TALENT MATCH
**Date:** October 28, 2026  
**Project Root:** `C:\Users\kesha\OneDrive\Desktop\Radix_talent_match`

---

## 1. System-Wide Integration Matrix

| Module | Actual Backend Folder | FastAPI Entry Point | Configured Port | Route & Method | Frontend Page | Input Schema | Output Schema | Downstream Dependency | Environment Variables |
|---|---|---|:---:|---|---|---|---|---|---|
| **01. JD Analytics** | `jd_analytics` | `api.py` | `8001` | `POST /jd-analytics/extract`<br>`GET /jd-analytics/list`<br>`GET /health` | `/app/jd-analytics` | Multipart file (`file`: PDF/DOCX) or JSON (`raw_text`, `role`, `company`) | `ExtractedSkillList`: `{ source_type, source_file, company, role, skills: [{ skill_name, category_code, evidence, confidence }] }` | Role 5 (Skill Matching) requires the analyzed JD skill list | `GROQ_API_KEY` (optional for fallback analysis) |
| **02. Resume Parsing** | `resume-parsing-llm` | `app/main.py` | `8002` | `POST /resume-parsing/extract`<br>`GET /resume-parsing/samples`<br>`GET /health` | `/app/resume-parsing` | Multipart file (`file`: PDF/DOCX) or JSON (`sample_candidate_id`) | `ParsedResumeOutput`: `{ candidate_name, candidate_email, education, skills, projects, internships, hackathons, certifications, preferred_roles }` | Role 3 (Profile Builder) pre-fills fields from parsed resume | `GROQ_API_KEY` (optional) |
| **03. Profile Builder** | `profile_builder/backend` | `main.py` | `8003` | `POST /api/profiles`<br>`GET /api/profiles/{id}`<br>`PUT /api/profiles/{id}`<br>`POST /api/profiles/resume`<br>`GET /health` | `/app/profile` | `ProfileCreate` / `CandidateProfile`: `{ name, email, education, skills: [{ skill_name, category_code, level }], ... }` | `CandidateProfile`: `{ id, name, email, education, skills, hackathons, internships, cv_file, updated_at }` | Role 4 (Talent Check) & Role 5 (Skill Matching) require saved profile | `SUPABASE_URL`, `SUPABASE_KEY` (with resilient local storage fallback) |
| **04. Talent Check** | `Talent-match/backend` | `main.py` | `8004` | `POST /talent-check/check`<br>`POST /talent-check/evaluate`<br>`GET /talent-check/companies`<br>`GET /health` | `/app/talent-check` | `{ company: string, candidate: { candidate_id: string, skills: [{ category_code: string, level: 1-10 }] } }` | `TalentCheckResponse`: `{ company, readiness_score: 0-100, skillset_gap: [{ category_code, required_level, candidate_level, gap, gap_amount }] }` | Stage 4 completes candidate evaluation; feeds Dashboard | None required (uses local `data/company_skillsets.json`) |
| **05. Skill Matching** | `skill_matching` | `main.py` | `8005` | `POST /skill-matching/compare`<br>`GET /health` | `/app/skill-matching` | `{ profile: CandidateProfile, jd: ExtractedSkillList }` | `SkillMatchingResult`: `{ jd_source_file, match_score: 0-100, matched_skills, missing_skills, partial_skills }` | Stage 5 produces Final Consolidated Results | `GROQ_API_KEY` (optional) |
| **Master Frontend** | `radix-talent-match_frontend` | `src/main.tsx` | `5173` | Vite Dev Server | All routes (`/`, `/login`, `/app/*`) | User interactions & API responses | Rendered React components & state persistence | Displays consolidated workflow and results | `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`, individual service URL overrides |

---

## 2. End-to-End Data Pipeline

```text
+---------------------------------------------------------------------------------------------------+
|                                       MASTER FRONTEND (Vite: 5173)                                 |
+---------------------------------------------------------------------------------------------------+
       |                                       |                                         |
       v (1) Upload JD                         v (2) Upload Resume                       |
+--------------------------+       +-------------------------------+                     |
| Module 01: JD Analytics  |       | Module 02: Resume Parsing     |                     |
| Port: 8001               |       | Port: 8002                    |                     |
| ExtractedSkillList       |       | ParsedResumeOutput            |                     |
+--------------------------+       +-------------------------------+                     |
       |                                       |                                         |
       |                                       v (3) Pre-fill & Save Candidate Profile   |
       |                           +-------------------------------------+               |
       |                           | Module 03: Profile Builder          |               |
       |                           | Port: 8003                          |               |
       |                           | CandidateProfile                    |               |
       |                           +-------------------------------------+               |
       |                                  |                        |                     |
       |                                  v (4) Evaluate Bar       |                     |
       |                           +--------------------------+    |                     |
       |                           | Module 04: Talent Check  |    |                     |
       |                           | Port: 8004               |    |                     |
       |                           | TalentCheckResponse      |    |                     |
       |                           +--------------------------+    |                     |
       |                                                           |                     |
       +-----------------------------\   /-------------------------+                     |
                                      v v (5) Compare Specific JD vs Profile             |
                               +-----------------------------+                           |
                               | Module 05: Skill Matching   |                           |
                               | Port: 8005                  |                           |
                               | SkillMatchingResult         |                           |
                               +-----------------------------+                           |
                                              |                                          |
                                              v                                          |
                              +-------------------------------+                          |
                              |     FINAL RESULTS VIEW        |<-------------------------+
                              | Matched Skills & Gap Analysis |
                              +-------------------------------+
```

---

## 3. Detailed Data Schema Contracts

### 3.1 Common Skill Model (`<skill>`)
```json
{
  "skill_name": "FastAPI",
  "category_code": "SWE",
  "evidence": "Built high-performance microservices using FastAPI and Pydantic.",
  "confidence": "high",
  "proficiency_level": 8
}
```

### 3.2 JD Analytics Output (`ExtractedSkillList`)
```json
{
  "source_type": "jd",
  "source_file": "Google LLC - Software Engineer.pdf",
  "company": "Google LLC",
  "role": "Software Engineer (SWE)",
  "skills": [
    {
      "skill_name": "Data Structures",
      "category_code": "DSA",
      "evidence": "Demonstrated expertise in core algorithms and data structures.",
      "confidence": "high"
    }
  ]
}
```

### 3.3 Resume Parsing Output (`ParsedResumeOutput`)
```json
{
  "source_type": "resume",
  "source_file": "Ananya Rao.pdf",
  "candidate_name": "Ananya Rao",
  "candidate_email": "ananya.rao@example.com",
  "skills": [ ... ],
  "education": [ ... ],
  "projects": [ ... ],
  "internships": [ ... ],
  "hackathons": [ ... ],
  "certifications": [ ... ],
  "preferred_roles": ["Software Engineer", "Backend Developer"]
}
```

### 3.4 Profile Builder Contract (`CandidateProfile`)
```json
{
  "id": "c-001",
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "education": [ ... ],
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "Proficient in Python for distributed systems.",
      "confidence": "high",
      "proficiency_level": 9
    }
  ],
  "cv_file": "Ananya_Rao_CV.pdf",
  "updated_at": "2026-10-28T19:50:00Z"
}
```

### 3.5 Talent Check Contract (`TalentCheckResponse`)
```json
{
  "company": "Google",
  "readiness_score": 85.5,
  "skillset_gap": [
    {
      "category_code": "DSA",
      "required_level": 9.0,
      "candidate_level": 8.0,
      "gap": true,
      "gap_amount": 1.0
    }
  ]
}
```

### 3.6 Skill Matching Contract (`SkillMatchingResult`)
```json
{
  "jd_source_file": "Google LLC - Software Engineer.pdf",
  "candidate_name": "Ananya Rao",
  "company": "Google LLC",
  "role": "Software Engineer",
  "match_score": 82,
  "matched_skills": [ ... ],
  "missing_skills": [ ... ],
  "partial_skills": [
    {
      "jd_skill": { "skill_name": "AWS", "category_code": "CLOUD" },
      "candidate_skill": { "skill_name": "Docker", "category_code": "CLOUD" },
      "similarity_note": "Shared category competency in Cloud & DevOps."
    }
  ]
}
```
