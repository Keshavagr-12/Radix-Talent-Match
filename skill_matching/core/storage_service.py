"""
JSON Storage Service for Skill Matching (Port 8005).
Persists match evaluations to central data/skill_matching_results.json and local matches.json.
Starts completely empty — zero mock data seeded.
Completely replaces Supabase tables.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger("skill_matching.storage")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[2] if len(_current_file.parents) > 2 else _current_file.parents[1]

PRIMARY_MATCHES_FILE = ROOT_DIR / "data" / "skill_matching_results.json"
LOCAL_MATCHES_FILE = _current_file.parent.parent / "data" / "matches.json"


def save_match_result(result_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist match result into JSON storage.
    Does NOT seed fake evaluations: stores only real evaluations performed.
    """
    record = {
        **result_data,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }

    for path in (PRIMARY_MATCHES_FILE, LOCAL_MATCHES_FILE):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            matches: List[Dict[str, Any]] = []
            if path.exists():
                try:
                    with path.open("r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            matches = data
                        elif isinstance(data, dict):
                            matches = list(data.values())
                except Exception:
                    matches = []

            matches.append(record)
            tmp = path.parent / f".tmp_{uuid4().hex}_{path.name}"
            with tmp.open("w", encoding="utf-8") as f:
                json.dump(matches, f, indent=2)
            tmp.replace(path)
        except Exception as exc:
            logger.warning(f"Failed to write match result to {path}: {exc}")

    return record


def list_matches(candidate_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """List saved match evaluation history. Starts empty."""
    for path in (PRIMARY_MATCHES_FILE, LOCAL_MATCHES_FILE):
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data if isinstance(data, list) else list(data.values())
                    if candidate_name:
                        return [m for m in items if m.get("candidate_name") == candidate_name]
                    return items
            except Exception:
                pass
    return []
