"""
Candidate Profile Loader for RADIX Talent Check.
Loads candidate profiles directly from the central data/profiles.json repository,
and derives candidate proficiency levels across all 12 RADIX categories
from skills parsed from the resume.
Completely replaces Supabase tables.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from utils.constants import RADIX_SKILLSET_CODES, RADIX_CATEGORY_METADATA

logger = logging.getLogger("talent_check.candidate_loader")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[3] if len(_current_file.parents) > 3 else _current_file.parents[2]

PRIMARY_PROFILES_FILE = ROOT_DIR / "data" / "profiles.json"
LOCAL_PROFILES_FILE = (
    _project_root
    / "profile_builder"
    / "backend"
    / "data"
    / "profiles.json"
) if "_project_root" in locals() else PRIMARY_PROFILES_FILE


def derive_12_skillset_levels(skills: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Derive the candidate's proficiency levels (1-10) across all 12 RADIX categories
    directly from the parsed resume skills in their profile.
    """
    category_skills_map: Dict[str, List[Dict[str, Any]]] = {code: [] for code in RADIX_SKILLSET_CODES}

    for s in skills:
        code = str(s.get("category_code") or "").strip().upper()
        if code in category_skills_map:
            category_skills_map[code].append(s)

    derived_levels: Dict[str, float] = {}

    for code in RADIX_SKILLSET_CODES:
        matching = category_skills_map[code]
        if not matching:
            derived_levels[code] = 0.0
            continue

        levels: List[float] = []
        for item in matching:
            lvl = item.get("proficiency_level")
            if lvl is None:
                lvl = item.get("level")

            if lvl is not None:
                try:
                    levels.append(float(lvl))
                    continue
                except (ValueError, TypeError):
                    pass

            conf = str(item.get("confidence") or "").lower()
            if conf == "high":
                levels.append(8.0)
            elif conf == "medium":
                levels.append(6.0)
            else:
                levels.append(4.0)

        if levels:
            exact_level = max(levels)
            derived_levels[code] = int(exact_level) if float(exact_level).is_integer() else round(exact_level, 1)
        else:
            derived_levels[code] = 0.0

    return derived_levels


def load_all_candidate_profiles() -> List[Dict[str, Any]]:
    """
    Load all candidate profiles from data/profiles.json repository.
    Returns structured profiles with their real parsed skills and derived 12-category levels.
    """
    profiles_dict: Dict[str, Dict[str, Any]] = {}

    for path in (PRIMARY_PROFILES_FILE, ROOT_DIR / "profile_builder" / "backend" / "data" / "profiles.json"):
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    local_data = json.load(f)
                    if isinstance(local_data, dict):
                        for pid, rec in local_data.items():
                            prof = rec.get("profile") or rec
                            profiles_dict[pid] = {
                                "id": pid,
                                "profile": prof,
                                "created_at": rec.get("created_at"),
                                "updated_at": rec.get("updated_at"),
                            }
                        if profiles_dict:
                            break
            except Exception as exc:
                logger.warning(f"Failed to read profiles from {path}: {exc}")

    result: List[Dict[str, Any]] = []
    for pid, entry in profiles_dict.items():
        prof = entry.get("profile") or {}
        skills = prof.get("skills") or []
        derived = derive_12_skillset_levels(skills)

        result.append({
            "id": pid,
            "candidate_id": pid,
            "name": prof.get("name") or "Unnamed Candidate",
            "headline": prof.get("headline", ""),
            "email": prof.get("email", ""),
            "skills_count": len(skills),
            "skills": skills,
            "derived_skill_levels": derived,
            "profile": prof,
        })

    return result


def get_candidate_profile_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve candidate profile by ID from JSON repository.
    """
    candidates = load_all_candidate_profiles()
    for cand in candidates:
        if cand["id"] == candidate_id or cand["candidate_id"] == candidate_id:
            return cand
        prof = cand.get("profile") or {}
        if prof.get("id") == candidate_id or prof.get("candidate_id") == candidate_id:
            return cand
    return None
