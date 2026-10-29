"""
Persistent Storage Engine for RADIX JD Analytics.
Manages storage and retrieval of real, user-analyzed Job Descriptions.
NO mock/sample data is seeded: starts empty and persists every uploaded/submitted JD.
"""

import json
from pathlib import Path
from typing import List, Optional, Dict, Any

DATA_DIR = Path(__file__).resolve().parent / "data"
STORAGE_FILE = DATA_DIR / "jobs.json"


def _ensure_storage():
    """Ensures data directory and storage file exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STORAGE_FILE.exists():
        STORAGE_FILE.write_text("[]", encoding="utf-8")


def get_all_jobs() -> List[Dict[str, Any]]:
    """
    Returns all real, user-submitted job descriptions stored in the database,
    ordered by most recently analyzed first.
    """
    _ensure_storage()
    try:
        content = STORAGE_FILE.read_text(encoding="utf-8").strip()
        if not content:
            return []
        data = json.loads(content)
        if isinstance(data, list):
            # Sort newest first
            return sorted(data, key=lambda x: x.get("analyzed_at", ""), reverse=True)
        return []
    except Exception as exc:
        print(f"[JD Storage] Warning: Failed to read jobs from {STORAGE_FILE}: {exc}")
        return []


def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific stored job description by its ID."""
    jobs = get_all_jobs()
    for j in jobs:
        if j.get("id") == job_id:
            return j
    return None


def save_job(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persists a new or updated job description to the JSON store.
    """
    _ensure_storage()
    jobs = get_all_jobs()
    job_id = job_data.get("id")

    # Update if exists, else prepend
    existing_idx = next((i for i, j in enumerate(jobs) if j.get("id") == job_id), None)
    if existing_idx is not None:
        jobs[existing_idx] = job_data
    else:
        jobs.insert(0, job_data)

    try:
        STORAGE_FILE.write_text(json.dumps(jobs, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        print(f"[JD Storage] Warning: Failed to persist job {job_id}: {exc}")

    return job_data


def delete_job(job_id: str) -> bool:
    """Deletes an analyzed job description by ID."""
    _ensure_storage()
    jobs = get_all_jobs()
    new_jobs = [j for j in jobs if j.get("id") != job_id]
    if len(new_jobs) == len(jobs):
        return False
    STORAGE_FILE.write_text(json.dumps(new_jobs, indent=2, ensure_ascii=False), encoding="utf-8")
    return True


def clear_all_jobs():
    """Clears all stored job descriptions."""
    _ensure_storage()
    STORAGE_FILE.write_text("[]", encoding="utf-8")
