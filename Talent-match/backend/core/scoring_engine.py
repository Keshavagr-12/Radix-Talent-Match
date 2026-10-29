"""
Scoring engine for RADIX Talent Check.
Calculates candidate readiness score as a percentage and derives
status classification, gap counts, and readiness recommendations.
"""

from typing import Any, Dict, List, Tuple
from utils.constants import (
    READINESS_THRESHOLD_READY,
    READINESS_THRESHOLD_UPSKILLING,
    STATUS_LABELS,
    STATUS_NEEDS_PREP,
    STATUS_READY,
    STATUS_UPSKILLING,
)


def calculate_readiness_score(skillset_gap: List[Dict[str, Any]]) -> float:
    """
    Calculate candidate readiness as a percentage (0.0 to 100.0).

    Formula:
        (sum of min(candidate_level, required_level) / sum of required_level) * 100
    """
    if not skillset_gap:
        return 0.0

    total_required = 0.0
    total_candidate = 0.0

    for skill in skillset_gap:
        required_level = float(skill["required_level"])
        candidate_level = float(skill["candidate_level"])

        total_required += required_level
        total_candidate += min(candidate_level, required_level)

    if total_required <= 0:
        return 0.0

    score = (total_candidate / total_required) * 100.0
    return round(score, 2)


def classify_readiness(
    readiness_score: float,
    skillset_gap: List[Dict[str, Any]],
    company_name: str = "Company",
) -> Dict[str, Any]:
    """
    Derive the numerical readiness verdict and summary metrics.
    Threshold:
      >= 80.0%: Ready for Target Role
      65.0% - 79.9%: Upskilling Recommended
      < 65.0%: Needs Focused Preparation
    """
    met_count = sum(1 for item in skillset_gap if not item.get("gap", False))
    gap_count = sum(1 for item in skillset_gap if item.get("gap", False))

    if readiness_score >= READINESS_THRESHOLD_READY:
        status = STATUS_READY
        label = STATUS_LABELS[STATUS_READY]
        summary = (
            f"Candidate readiness is {readiness_score:.1f}% (meets/approaches target bar of {READINESS_THRESHOLD_READY}%). "
            f"Meets expectations in {met_count} of {len(skillset_gap)} evaluated skillsets. Ready for recruitment screening."
        )
    elif readiness_score >= READINESS_THRESHOLD_UPSKILLING:
        status = STATUS_UPSKILLING
        label = STATUS_LABELS[STATUS_UPSKILLING]
        top_gaps = [
            f"{item['category_code']} (-{item['gap_amount']})"
            for item in skillset_gap if item.get("gap")
        ][:3]
        gaps_str = ", ".join(top_gaps) if top_gaps else "minor skill gaps"
        summary = (
            f"Candidate readiness is {readiness_score:.1f}%. Strong foundational competencies, but targeted preparation "
            f"is recommended in {gap_count} areas: {gaps_str}."
        )
    else:
        status = STATUS_NEEDS_PREP
        label = STATUS_LABELS[STATUS_NEEDS_PREP]
        top_gaps = [
            f"{item['category_code']} (-{item['gap_amount']})"
            for item in skillset_gap if item.get("gap")
        ][:4]
        gaps_str = ", ".join(top_gaps) if top_gaps else "multiple skill categories"
        summary = (
            f"Candidate readiness is {readiness_score:.1f}% (below threshold of {READINESS_THRESHOLD_READY}%). "
            f"Significant gap across {gap_count} competencies: {gaps_str}. Focused upskilling recommended."
        )

    return {
        "readiness_status": status,
        "readiness_label": label,
        "threshold": READINESS_THRESHOLD_READY,
        "met_categories_count": met_count,
        "gap_categories_count": gap_count,
        "summary": summary,
    }
