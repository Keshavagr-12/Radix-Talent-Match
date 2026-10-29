"""
FastAPI Router for RADIX Talent Check (Role 4).
Provides endpoints to:
1. List benchmark companies from authoritative company_skill_levels_staging.json.
2. List candidate profiles from the candidate profile folder (data/profiles.json).
3. Run 12-skillset gap analysis and readiness scoring against selected company.
4. Fetch evaluation history persisted in local/central JSON database.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from core.benchmark_loader import load_benchmarks
from core.candidate_profile_loader import (
    derive_12_skillset_levels,
    get_candidate_profile_by_id,
    load_all_candidate_profiles,
)
from core.readiness_service import check_candidate_readiness
from core.evaluation_storage_service import list_evaluations
from models.talent_schemas import (
    CandidateProfile,
    TalentCheckResponse,
)

router = APIRouter(
    prefix="/talent-check",
    tags=["Talent Check"],
)


class FlexibleProfileInput(BaseModel):
    id: Optional[str] = None
    candidate_id: Optional[str] = None
    name: Optional[str] = "Candidate"
    skills: List[Dict[str, Any]] = []


class FlexibleTalentCheckRequest(BaseModel):
    company: str
    candidate_id: Optional[str] = None
    candidate: Optional[CandidateProfile] = None
    profile: Optional[FlexibleProfileInput] = None
    candidate_skills: Optional[Dict[str, float]] = None


COMPANY_METADATA_TIERS: Dict[str, Dict[str, str]] = {
    "Google LLC": {
        "tierDescriptor": "Global Hyperscale Technology & AI Engineering",
        "headquarters": "Bengaluru, India (Hybrid)",
        "summary": "Emphasizes algorithmic rigor (DSA), distributed systems (SYSD), production coding (COD), and foundational AI/Cloud.",
    },
    "Google": {
        "tierDescriptor": "Global Hyperscale Technology & AI Engineering",
        "headquarters": "Bengaluru, India (Hybrid)",
        "summary": "Emphasizes algorithmic rigor (DSA), distributed systems (SYSD), production coding (COD), and foundational AI/Cloud.",
    },
    "Microsoft Corporation": {
        "tierDescriptor": "Enterprise Cloud, Developer Platforms & Applied Data",
        "headquarters": "Hyderabad, India",
        "summary": "Balances Object-Oriented Design (OOD), Software Engineering lifecycle (SWE), Cloud architecture, and enterprise SQL/Data systems.",
    },
    "Microsoft": {
        "tierDescriptor": "Enterprise Cloud, Developer Platforms & Applied Data",
        "headquarters": "Hyderabad, India",
        "summary": "Balances Object-Oriented Design (OOD), Software Engineering lifecycle (SWE), Cloud architecture, and enterprise SQL/Data systems.",
    },
    "Oracle Financial Services Software": {
        "tierDescriptor": "Core Banking Platforms, Relational Data & Enterprise Support",
        "headquarters": "Bengaluru / Mumbai / Chennai, India",
        "summary": "Prioritizes advanced SQL & relational data proficiency, Object-Oriented Java systems, and clear stakeholder communication.",
    },
    "Oracle": {
        "tierDescriptor": "Core Banking Platforms, Relational Data & Enterprise Support",
        "headquarters": "Bengaluru / Mumbai / Chennai, India",
        "summary": "Prioritizes advanced SQL & relational data proficiency, Object-Oriented Java systems, and clear stakeholder communication.",
    },
    "Amazon": {
        "tierDescriptor": "High-Throughput E-Commerce, AWS Cloud & Resilient Services",
        "headquarters": "Hyderabad / Bengaluru, India",
        "summary": "Emphasizes scalable microservices, deep algorithms & data structures, high-availability architecture, and cloud best practices.",
    },
    "Meta Platforms": {
        "tierDescriptor": "Global Social Media, Open Source & Frontier AI",
        "headquarters": "Menlo Park, CA / Remote",
        "summary": "Focuses on large-scale distributed systems, cutting-edge AI, high-efficiency systems coding, and rigorous SWE practices.",
    },
    "Apple Inc.": {
        "tierDescriptor": "Consumer Hardware, Operating Systems & Silicon Ecosystem",
        "headquarters": "Cupertino, CA / Bengaluru, India",
        "summary": "Emphasizes OS fundamentals, kernel & hardware architecture, object-oriented systems design, and performance-critical software.",
    },
    "Netflix": {
        "tierDescriptor": "Global Streaming Media, Microservices & High-Availability Cloud",
        "headquarters": "Los Gatos, CA / Remote",
        "summary": "Requires elite system design, chaos engineering, high-throughput AWS cloud services, and production distributed computing.",
    },
    "Salesforce": {
        "tierDescriptor": "Enterprise SaaS Platforms, Cloud CRM & Developer Tooling",
        "headquarters": "San Francisco, CA / Hyderabad, India",
        "summary": "Focuses on scalable multi-tenant architecture, enterprise cloud, object-oriented design, and database engineering.",
    },
    "Adobe Inc.": {
        "tierDescriptor": "Creative Software, Document Cloud & Digital Experience",
        "headquarters": "San Jose, CA / Noida, India",
        "summary": "Prioritizes algorithms, high-performance C++ & graphics programming, object-oriented architecture, and AI-driven workflows.",
    },
    "Cisco Systems": {
        "tierDescriptor": "Enterprise Networking, Distributed Telecom & Cybersecurity",
        "headquarters": "San Jose, CA / Bengaluru, India",
        "summary": "Demands deep network engineering, protocol design, Linux/Unix kernel internals, and embedded systems architecture.",
    },
    "Uber Technologies": {
        "tierDescriptor": "Real-Time Dispatch, Geo-Distributed Services & Mobility",
        "headquarters": "San Francisco, CA / Bengaluru, India",
        "summary": "Emphasizes high-concurrency real-time systems, algorithmic matching, geospatial processing, and microservice resilience.",
    },
    "Tata Consultancy Services (TCS)": {
        "tierDescriptor": "Global IT Consulting, Enterprise Transformation & System Integration",
        "headquarters": "Mumbai, India",
        "summary": "Balances multi-platform software engineering, relational databases, enterprise testing, and client technical communication.",
    },
    "Infosys Limited": {
        "tierDescriptor": "Digital Services, Enterprise Cloud Migration & Business Software",
        "headquarters": "Bengaluru, India",
        "summary": "Prioritizes enterprise Java/Cloud systems, database design, SDLC hygiene, and global team collaboration.",
    },
}


@router.get("/companies")
def get_benchmark_companies():
    """
    Return all available benchmark companies.
    Fetches directly from authoritative dataset `company_skill_levels_staging.json`.
    """
    data = load_benchmarks()
    companies = data.get("companies", data)
    result = []
    seen = set()

    for name, skill_bar in companies.items():
        if name not in seen:
            seen.add(name)
            meta = COMPANY_METADATA_TIERS.get(name, {
                "tierDescriptor": "Enterprise Benchmark Tier",
                "headquarters": "India Operations",
                "summary": f"12-skillset expectation benchmark for {name}.",
            })
            result.append({
                "company_name": name,
                "short_name": name.split()[0],
                "tier_descriptor": meta["tierDescriptor"],
                "headquarters": meta["headquarters"],
                "evaluation_summary": meta["summary"],
                "readiness_threshold": 80.0,
                "expected_skills": skill_bar,
            })

    return result


@router.get("/candidates")
def get_candidates():
    """
    Return all candidate profiles from the candidate profile folder
    (`profile_builder/backend/data/profiles.json` and Supabase `profiles` table),
    including their real parsed skills from resume and derived 12-skillset levels.
    """
    return load_all_candidate_profiles()


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    """
    Return a specific candidate's parsed profile and derived 12-skillset levels.
    """
    cand = get_candidate_profile_by_id(candidate_id)
    if not cand:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate with ID '{candidate_id}' not found in candidate profiles folder.",
        )
    return cand


@router.post("/check", response_model=TalentCheckResponse)
def talent_check(request: FlexibleTalentCheckRequest):
    """
    Compare candidate profile against target company's 12-skillset expectations
    and return readiness score, gap breakdown, and status verdict.
    Automatically resolves proficiency levels from candidate's parsed resume profile.
    """
    try:
        candidate_skills: Dict[str, float] = {}
        candidate_id: Optional[str] = request.candidate_id
        candidate_name: Optional[str] = None

        # Case 1: Candidate ID passed without skills -> load directly from profile builder folder
        if candidate_id and not request.candidate and not request.profile and not request.candidate_skills:
            cand = get_candidate_profile_by_id(candidate_id)
            if cand:
                candidate_name = cand["name"]
                candidate_skills = cand["derived_skill_levels"]

        # Case 2: Candidate object passed
        if request.candidate:
            candidate_id = request.candidate.candidate_id or candidate_id
            candidate_name = request.candidate.name or candidate_name
            if request.candidate.skills:
                raw_skills = [
                    {"category_code": s.category_code, "proficiency_level": s.level}
                    for s in request.candidate.skills
                ]
                candidate_skills = derive_12_skillset_levels(raw_skills)

        # Case 3: Profile object passed (from React frontend or Profile Builder)
        elif request.profile:
            candidate_id = request.profile.id or request.profile.candidate_id or candidate_id
            candidate_name = request.profile.name or candidate_name
            if request.profile.skills:
                candidate_skills = derive_12_skillset_levels(request.profile.skills)

        # Case 4: Explicit candidate_skills map passed
        elif request.candidate_skills:
            candidate_skills = {
                str(k).upper(): float(v)
                for k, v in request.candidate_skills.items()
            }

        # If still empty but candidate_id exists, try loading profile
        if not candidate_skills and candidate_id:
            cand = get_candidate_profile_by_id(candidate_id)
            if cand:
                candidate_name = cand["name"]
                candidate_skills = cand["derived_skill_levels"]

        result = check_candidate_readiness(
            company=request.company,
            candidate_skills=candidate_skills,
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            persist=True,
        )

        return result

    except (ValueError, FileNotFoundError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


@router.post("/evaluate", response_model=TalentCheckResponse)
def talent_evaluate(request: FlexibleTalentCheckRequest):
    """Alias for /check endpoint."""
    return talent_check(request)


@router.get("/evaluations")
def get_evaluations(candidate_id: Optional[str] = Query(None)):
    """
    List real evaluation history from Supabase / local database.
    Zero mock data: starts completely empty until evaluations are executed.
    """
    return list_evaluations(candidate_id=candidate_id)
