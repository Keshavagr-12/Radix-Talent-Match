"""
Validation utilities for Talent Check API inputs.
"""

from typing import Any, Dict, List, Tuple
from utils.constants import RADIX_SKILLSET_CODES


def validate_company_name(company: str) -> str:
    """Validate and clean company name."""
    if not company or not isinstance(company, str) or not company.strip():
        raise ValueError("Company name must be a non-empty string.")
    return company.strip()


def validate_skill_level(level: Any) -> float:
    """Ensure skill level is a float between 1.0 and 10.0."""
    try:
        val = float(level)
    except (ValueError, TypeError):
        raise ValueError(f"Skill level must be a numeric value, got: {level}")

    if val < 0.0 or val > 10.0:
        raise ValueError(f"Skill level must be between 0.0 and 10.0, got: {val}")

    return round(val, 2)


def normalize_category_code(code: str) -> str:
    """Standardize category code to uppercase canonical 12 RADIX code."""
    cleaned = (code or "").strip().upper()
    # Map common aliases if needed
    alias_map = {
        "CODING": "COD",
        "SYSTEM_DESIGN": "SYSD",
        "SYSTEMS": "SYSD",
        "DATABASE": "SQL",
        "DATABASES": "SQL",
        "NETWORKING": "NETW",
        "APTITUDE": "APTI",
        "COMMUNICATION": "COMM",
    }
    return alias_map.get(cleaned, cleaned)
