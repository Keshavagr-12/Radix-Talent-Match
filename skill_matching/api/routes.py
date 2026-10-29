"""
FastAPI Routes for RADIX Skill Matching Service (Role 5 - Port 8005).
Provides endpoints for comparing candidate profiles against extracted Job Descriptions,
fetching candidates from Profile Builder, fetching JDs from JD Analytics, and viewing match history.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException

try:
    from skill_matching.models.schemas import (
        SkillMatchingRequest,
        SkillMatchingResponse,
        CandidateOption,
        JDOption,
    )
    from skill_matching.core.llm_matcher import run_llm_skill_matching
    from skill_matching.core.gap_analyzer import build_gap_analysis
    from skill_matching.core.profile_loader import list_candidate_profiles, get_candidate_profile_by_id
    from skill_matching.core.jd_loader import list_extracted_jds, get_jd_by_id
    from skill_matching.core.storage_service import save_match_result, list_matches
except ImportError:
    from models.schemas import (
        SkillMatchingRequest,
        SkillMatchingResponse,
        CandidateOption,
        JDOption,
    )
    from core.llm_matcher import run_llm_skill_matching
    from core.gap_analyzer import build_gap_analysis
    from core.profile_loader import list_candidate_profiles, get_candidate_profile_by_id
    from core.jd_loader import list_extracted_jds, get_jd_by_id
    from core.storage_service import save_match_result, list_matches

logger = logging.getLogger("skill_matching.api")

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "skill_matching",
        "port": 8005,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/skill-matching/candidates", response_model=List[CandidateOption])
def get_candidates():
    """List available candidates from Profile Builder."""
    candidates = list_candidate_profiles()
    return [
        CandidateOption(
            id=c["id"],
            name=c["name"],
            skills_count=c["skills_count"],
            headline=c.get("headline")
        )
        for c in candidates
    ]


@router.get("/skill-matching/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    """Retrieve full profile for a candidate."""
    profile = get_candidate_profile_by_id(candidate_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")
    return profile


@router.get("/skill-matching/jds", response_model=List[JDOption])
def get_jds():
    """List available extracted Job Descriptions from JD Analytics."""
    jds = list_extracted_jds()
    return [
        JDOption(
            id=j["id"],
            company=j["company"],
            role=j["role"],
            source_file=j["source_file"],
            skills_count=j["skills_count"]
        )
        for j in jds
    ]


@router.get("/skill-matching/jds/{jd_id}")
def get_jd(jd_id: str):
    """Retrieve full extracted data for a specific JD."""
    jd_data = get_jd_by_id(jd_id)
    if not jd_data:
        raise HTTPException(status_code=404, detail=f"Job Description '{jd_id}' not found.")
    return jd_data


@router.get("/skill-matching/history")
def get_match_history(candidate_name: Optional[str] = None):
    """View evaluation match history (starts empty, zero mock data)."""
    return list_matches(candidate_name=candidate_name)


@router.post("/skill-matching/compare", response_model=SkillMatchingResponse)
def compare_candidate_to_jd(request: SkillMatchingRequest):
    """
    Compare a Candidate Profile against an extracted Job Description.
    Prioritizes missing skill gap analysis and handles semantic fuzziness.
    """
    # 1. Resolve Profile data
    profile_data = request.profile
    if not profile_data and request.candidate_id:
        profile_data = get_candidate_profile_by_id(request.candidate_id)

    if not profile_data:
        profile_data = {}

    candidate_skills = profile_data.get("skills", [])
    candidate_name = profile_data.get("name") or "Candidate"

    # 2. Resolve JD data
    jd_data = request.jd
    if not jd_data and request.jd_id:
        jd_data = get_jd_by_id(request.jd_id)

    if not jd_data:
        raise HTTPException(
            status_code=400,
            detail="No Job Description provided. Please provide JD data or a valid jd_id from JD Analytics."
        )

    jd_skills = jd_data.get("skills", [])
    if not jd_skills:
        raise HTTPException(
            status_code=400,
            detail="The provided Job Description has no extracted skills. Analyze a JD in Role 1 first."
        )

    company = jd_data.get("company") or "Target Company"
    role = jd_data.get("role") or "Target Role"
    source_file = jd_data.get("source_file") or "Job Description"

    # 3. Execute Dual Matching (Groq LLM with deterministic fuzzy fallback)
    matched_skills, missing_skills, partial_skills, earned_points = run_llm_skill_matching(
        jd_skills=jd_skills,
        candidate_skills=candidate_skills,
        company=company,
        role=role
    )

    # 4. Compute Match Score (0 - 100)
    total_possible_points = len(jd_skills) * 10.0
    raw_score = (earned_points / max(total_possible_points, 1.0)) * 100.0
    match_score = min(100, max(0, int(round(raw_score))))

    # 5. Prioritize Gap Analysis
    gap_analysis = build_gap_analysis(
        jd_skills=jd_skills,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        partial_skills=partial_skills,
        company=company,
        role=role
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    match_id = f"sm-{int(datetime.now().timestamp())}"

    response_data = SkillMatchingResponse(
        id=match_id,
        candidate_name=candidate_name,
        company=company,
        role=role,
        jd_source_file=source_file,
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        partial_skills=partial_skills,
        gap_analysis=gap_analysis,
        evaluated_at=now_iso
    )

    # 6. Persist match evaluation (Supabase & local JSON)
    try:
        save_match_result(response_data.model_dump())
    except Exception as exc:
        logger.warning(f"Could not persist match result: {exc}")

    return response_data


@router.post("/skill-matching/match", response_model=SkillMatchingResponse)
def match_alias(request: SkillMatchingRequest):
    """Alias for /skill-matching/compare."""
    return compare_candidate_to_jd(request)
