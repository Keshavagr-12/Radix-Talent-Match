"""
Persistent Storage Engine for RADIX Resume Parsing.
Manages storage and retrieval of real, user-parsed candidate resumes.
NO mock/sample data is seeded: starts empty and persists every parsed resume.
"""

import sys
import json
from pathlib import Path
from typing import List, Optional, Dict, Any

_app_dir = Path(__file__).resolve().parent
_pkg_dir = _app_dir.parent
if str(_pkg_dir) not in sys.path:
    sys.path.insert(0, str(_pkg_dir))

try:
    from app.config import DATA_DIR, STORAGE_FILE
except (ImportError, ValueError):
    try:
        from .config import DATA_DIR, STORAGE_FILE
    except (ImportError, ValueError):
        from config import DATA_DIR, STORAGE_FILE


def _ensure_storage():
    """Ensures data directory and storage file exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STORAGE_FILE.exists():
        STORAGE_FILE.write_text("[]", encoding="utf-8")


def get_all_resumes() -> List[Dict[str, Any]]:
    """
    Returns all real, user-submitted candidate resumes stored in the database,
    ordered by most recently analyzed first.
    """
    _ensure_storage()
    try:
        content = STORAGE_FILE.read_text(encoding="utf-8").strip()
        if not content:
            return []
        data = json.loads(content)
        if isinstance(data, list):
            return sorted(data, key=lambda x: x.get("analyzed_at", ""), reverse=True)
        return []
    except Exception as exc:
        print(f"[Resume Storage] Warning: Failed to read resumes from {STORAGE_FILE}: {exc}")
        return []


def get_resume_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific stored resume by its ID."""
    resumes = get_all_resumes()
    for r in resumes:
        if r.get("id") == candidate_id:
            return r
    return None


def save_resume(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persists a new or updated resume to the JSON store.
    """
    _ensure_storage()
    resumes = get_all_resumes()
    candidate_id = resume_data.get("id")

    # Update if exists, else prepend
    existing_idx = next((i for i, r in enumerate(resumes) if r.get("id") == candidate_id), None)
    if existing_idx is not None:
        resumes[existing_idx] = resume_data
    else:
        resumes.insert(0, resume_data)

    try:
        STORAGE_FILE.write_text(json.dumps(resumes, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        print(f"[Resume Storage] Warning: Failed to persist resume {candidate_id}: {exc}")

    return resume_data


def delete_resume(candidate_id: str) -> bool:
    """Deletes a parsed resume by ID."""
    _ensure_storage()
    resumes = get_all_resumes()
    new_resumes = [r for r in resumes if r.get("id") != candidate_id]
    if len(new_resumes) == len(resumes):
        return False
    STORAGE_FILE.write_text(json.dumps(new_resumes, indent=2, ensure_ascii=False), encoding="utf-8")
    return True


def clear_all_resumes():
    """Clears all stored resumes."""
    _ensure_storage()
    STORAGE_FILE.write_text("[]", encoding="utf-8")
