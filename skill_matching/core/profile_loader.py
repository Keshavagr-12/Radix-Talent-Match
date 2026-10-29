"""
Profile Loader for Skill Matching (Port 8005).
Loads candidate profiles directly from the central data/profiles.json repository.
Completely replaces Supabase tables.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("skill_matching.profile_loader")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[2] if len(_current_file.parents) > 2 else _current_file.parents[1]

PRIMARY_PROFILES_FILE = ROOT_DIR / "data" / "profiles.json"
LOCAL_PROFILES_FILE = (
    ROOT_DIR
    / "profile_builder"
    / "backend"
    / "data"
    / "profiles.json"
)


def list_candidate_profiles() -> List[Dict[str, Any]]:
    """
    List all available candidates with their id, name, and skills.
    Sources directly from JSON storage without duplicating.
    """
    candidates: Dict[str, Dict[str, Any]] = {}

    for path in (PRIMARY_PROFILES_FILE, LOCAL_PROFILES_FILE):
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        for c_id, entry in data.items():
                            if c_id not in candidates:
                                prof = entry.get("profile") if isinstance(entry, dict) and "profile" in entry else entry
                                name = prof.get("name", "Unnamed Candidate")
                                skills = prof.get("skills", [])
                                candidates[c_id] = {
                                    "id": c_id,
                                    "name": name,
                                    "headline": prof.get("headline", ""),
                                    "skills_count": len(skills),
                                    "profile": {**prof, "id": c_id, "name": name, "skills": skills}
                                }
                        if candidates:
                            break
            except Exception as exc:
                logger.debug(f"Could not read profiles from {path}: {exc}")

    return list(candidates.values())


def get_candidate_profile_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full profile for a specific candidate ID."""
    for c in list_candidate_profiles():
        if c["id"] == candidate_id:
            return c.get("profile")
        prof = c.get("profile") or {}
        if prof.get("id") == candidate_id or prof.get("candidate_id") == candidate_id:
            return prof
    return None
