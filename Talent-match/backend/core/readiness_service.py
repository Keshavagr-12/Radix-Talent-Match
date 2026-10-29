"""
Candidate readiness service for RADIX Talent Check.
Coordinates benchmark loading, gap analysis, readiness scoring,
and database persistence.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from core.benchmark_loader import get_company_benchmarks_with_source
from core.gap_analyzer import analyze_skill_gaps
from core.scoring_engine import calculate_readiness_score, classify_readiness
from core.evaluation_storage_service import save_talent_evaluation


def check_candidate_readiness(
    company: str,
    candidate_skills: Dict[str, float],
    candidate_id: Optional[str] = None,
    candidate_name: Optional[str] = None,
    persist: bool = True,
) -> Dict[str, Any]:
    """
    Analyze candidate skills against selected company expectations across all 12 RADIX categories.

    Args:
        company: Target company name (e.g. "Google LLC", "Microsoft Corporation", etc.)
        candidate_skills: Dict mapping RADIX codes to proficiency levels (e.g. {"COD": 8, "DSA": 7, ...})
        candidate_id: Optional identifier for candidate profile tracking
        candidate_name: Optional human-readable name of candidate
        persist: Whether to save this real evaluation to Supabase and local store

    Returns:
        TalentCheckResponse dictionary.
    """
    # Step 1: Load company benchmarks from authoritative staging dataset / local snapshot
    company_benchmarks, source = get_company_benchmarks_with_source(company)

    # Step 2: Calculate per-category skill gaps
    skillset_gap = analyze_skill_gaps(candidate_skills, company_benchmarks)

    # Step 3: Compute mathematical readiness score (0 - 100)
    readiness_score = calculate_readiness_score(skillset_gap)

    # Step 4: Classify readiness verdict and threshold breakdown
    classification = classify_readiness(readiness_score, skillset_gap, company_name=company)

    evaluated_at = datetime.now(timezone.utc).isoformat()

    result = {
        "company": company,
        "readiness_score": readiness_score,
        "skillset_gap": skillset_gap,
        "readiness_status": classification["readiness_status"],
        "readiness_label": classification["readiness_label"],
        "threshold": classification["threshold"],
        "met_categories_count": classification["met_categories_count"],
        "gap_categories_count": classification["gap_categories_count"],
        "summary": classification["summary"],
        "source": source,
        "evaluated_at": evaluated_at,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name or "Candidate",
    }

    # Step 5: Save real evaluation record into database
    if persist:
        try:
            save_talent_evaluation(result)
        except Exception:
            pass

    return result
