"""
JSON Persistence Service for RADIX Talent Check.
Persists evaluation and skill gap results into local/central JSON stores.
Starts completely empty — zero mock data seeded.
Completely replaces Supabase tables.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger("talent_check.storage")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[3] if len(_current_file.parents) > 3 else _current_file.parents[2]

PRIMARY_RESULTS_FILE = ROOT_DIR / "data" / "talent_check_results.json"
LOCAL_EVALUATIONS_FILE = _current_file.parent.parent / "data" / "evaluations.json"


def save_talent_evaluation(evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist an evaluation result into JSON repository.
    Does NOT seed fake data: records only real evaluations performed by the user.
    """
    record = {
        **evaluation_data,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }

    for path in (PRIMARY_RESULTS_FILE, LOCAL_EVALUATIONS_FILE):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            evaluations: List[Dict[str, Any]] = []
            if path.exists():
                try:
                    with path.open("r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            evaluations = data
                        elif isinstance(data, dict):
                            evaluations = list(data.values())
                except Exception:
                    evaluations = []

            evaluations.append(record)
            tmp = path.parent / f".tmp_{uuid4().hex}_{path.name}"
            with tmp.open("w", encoding="utf-8") as f:
                json.dump(evaluations, f, indent=2)
            tmp.replace(path)
        except Exception as exc:
            logger.warning(f"Failed to write evaluation to {path}: {exc}")

    return record


def list_evaluations(candidate_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return evaluation history from JSON repository. Starts completely empty.
    """
    for path in (PRIMARY_RESULTS_FILE, LOCAL_EVALUATIONS_FILE):
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data if isinstance(data, list) else list(data.values())
                    if candidate_id:
                        return [e for e in items if e.get("candidate_id") == candidate_id]
                    return items
            except Exception:
                pass
    return []
