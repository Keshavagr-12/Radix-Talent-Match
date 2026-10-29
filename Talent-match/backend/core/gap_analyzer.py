"""
Gap analyzer for RADIX Talent Check.
Compares candidate assessed skills against company expectations across
all 12 RADIX skillset categories.
"""

from typing import Any, Dict, List
from utils.constants import RADIX_CATEGORY_METADATA


def analyze_skill_gaps(
    candidate_skills: Dict[str, float],
    company_benchmarks: Dict[str, float],
) -> List[Dict[str, Any]]:
    """
    Compare candidate skill levels with company benchmark requirements.

    Args:
        candidate_skills: e.g. {"COD": 6.0, "DSA": 8.0, "SQL": 5.0}
        company_benchmarks: e.g. {"COD": 8.0, "DSA": 9.0, "SQL": 7.0}

    Returns:
        List of dicts representing per-category gap details.
    """
    skillset_gap = []

    for category_code, raw_required in company_benchmarks.items():
        code = str(category_code).upper().strip()
        required_level = float(raw_required)

        # Get candidate level; default to 0.0 if not present
        candidate_level = float(candidate_skills.get(code, candidate_skills.get(code.lower(), 0.0)))

        has_gap = candidate_level < required_level
        gap_amount = max(0.0, required_level - candidate_level)
        # Round to integers if clean whole numbers, else float
        gap_amount_val = int(gap_amount) if gap_amount.is_integer() else round(gap_amount, 2)

        meta = RADIX_CATEGORY_METADATA.get(code, {})
        category_name = meta.get("name", code)

        skillset_gap.append({
            "category_code": code,
            "category_name": category_name,
            "required_level": int(required_level) if required_level.is_integer() else required_level,
            "candidate_level": int(candidate_level) if candidate_level.is_integer() else candidate_level,
            "gap": has_gap,
            "gap_amount": gap_amount_val,
            "meets_bar": not has_gap,
        })

    return skillset_gap
