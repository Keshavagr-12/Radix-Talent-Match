"""
JD Loader for Skill Matching (Port 8005).
Loads extracted Job Descriptions from central data/job_descriptions.json
and jd_analytics/data/jobs.json repositories.
Completely replaces Supabase tables.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("skill_matching.jd_loader")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[2] if len(_current_file.parents) > 2 else _current_file.parents[1]

PRIMARY_JOBS_FILE = ROOT_DIR / "data" / "job_descriptions.json"
LOCAL_JOBS_FILE = (
    ROOT_DIR
    / "jd_analytics"
    / "data"
    / "jobs.json"
)


def list_extracted_jds() -> List[Dict[str, Any]]:
    """
    List all extracted job descriptions from JD Analytics.
    Sources directly from JSON storage without duplicating.
    """
    jds: Dict[str, Dict[str, Any]] = {}

    for path in (PRIMARY_JOBS_FILE, LOCAL_JOBS_FILE):
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data if isinstance(data, list) else list(data.values()) if isinstance(data, dict) else []
                    for jd in items:
                        j_id = str(jd.get("id"))
                        if j_id not in jds:
                            skills = jd.get("skills", [])
                            jds[j_id] = {
                                "id": j_id,
                                "company": jd.get("company", "Unknown Company"),
                                "role": jd.get("role", "Software Engineer"),
                                "source_file": jd.get("source_file", "Job Description"),
                                "skills_count": len(skills),
                                "jd_data": jd,
                            }
            except Exception as exc:
                logger.debug(f"Could not read jobs from {path}: {exc}")

    return list(jds.values())


def get_jd_by_id(jd_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full JD extracted data by ID from JSON storage."""
    for jd_item in list_extracted_jds():
        if jd_item["id"] == jd_id:
            return jd_item.get("jd_data")
    return None
