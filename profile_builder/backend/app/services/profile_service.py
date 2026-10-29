"""
Profile Service for Profile Builder (Port 8003).
Uses central JSON storage (data/profiles.json) with atomic writes and local upload storage.
Completely replaces Supabase tables and Supabase Storage.
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
PRIMARY_STORAGE_FILE = ROOT_DIR / "data" / "profiles.json"
LOCAL_STORAGE_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "profiles.json"
UPLOADS_DIR = ROOT_DIR / "data" / "uploads"


def current_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_local_profiles() -> dict:
    for target in (PRIMARY_STORAGE_FILE, LOCAL_STORAGE_FILE):
        if target.exists():
            try:
                data = json.loads(target.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
    return {}


def _save_local_profiles(data: dict):
    for target in (PRIMARY_STORAGE_FILE, LOCAL_STORAGE_FILE):
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.parent / f".tmp_{uuid4().hex}_{target.name}"
            tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
            os.replace(tmp, target)
        except Exception:
            pass


def find_profile_by_email(email: str) -> dict | None:
    if not email:
        return None

    cleaned_email = email.strip().lower()
    local_data = _load_local_profiles()

    for pid, record in local_data.items():
        prof = record.get("profile", {})
        saved_email = (prof.get("email") or "").strip().lower()
        if saved_email == cleaned_email:
            return {"id": pid, "profile": prof}

    return None


def get_profile_by_id(profile_id: str, token: str | None = None) -> dict:
    local_data = _load_local_profiles()

    # Exact key match
    if profile_id in local_data:
        rec = local_data[profile_id]
        return {
            "id": profile_id,
            "profile": rec.get("profile") or {},
            "created_at": rec.get("created_at"),
            "updated_at": rec.get("updated_at"),
        }

    # Match by candidate_id or id in profile
    for pid, rec in local_data.items():
        prof = rec.get("profile", {})
        if prof.get("id") == profile_id or prof.get("candidate_id") == profile_id:
            return {
                "id": pid,
                "profile": prof,
                "created_at": rec.get("created_at"),
                "updated_at": rec.get("updated_at"),
            }

    raise HTTPException(status_code=404, detail="Profile not found.")


def create_profile_record(profile_data: dict, profile_id: str | None = None, token: str | None = None) -> str:
    new_id = profile_id or str(uuid4())
    local_data = _load_local_profiles()
    now_str = current_time()

    local_data[new_id] = {
        "id": new_id,
        "profile": profile_data,
        "created_at": now_str,
        "updated_at": now_str,
    }
    _save_local_profiles(local_data)
    return new_id


def update_profile_record(profile_id: str, updates: dict, token: str | None = None) -> dict:
    current = get_profile_by_id(profile_id, token)
    existing_profile = current.get("profile") or {}

    valid_id = profile_id
    merged_profile = {**existing_profile, **updates}
    if merged_profile.get("email"):
        merged_profile["email"] = merged_profile["email"].strip().lower()

    local_data = _load_local_profiles()
    now_str = current_time()
    created_at = current.get("created_at") or now_str

    local_data[valid_id] = {
        "id": valid_id,
        "profile": merged_profile,
        "created_at": created_at,
        "updated_at": now_str,
    }
    _save_local_profiles(local_data)

    return {
        "message": "Profile updated successfully.",
        "id": valid_id,
        "profile": merged_profile,
    }


def delete_profile_record(profile_id: str, token: str | None = None) -> bool:
    local_data = _load_local_profiles()
    deleted = False

    if profile_id in local_data:
        del local_data[profile_id]
        deleted = True

    for pid in list(local_data.keys()):
        prof = local_data[pid].get("profile", {})
        if prof.get("id") == profile_id or prof.get("candidate_id") == profile_id:
            del local_data[pid]
            deleted = True

    if deleted:
        _save_local_profiles(local_data)

    return deleted


def upload_cv_file(
    profile_id: str,
    filename: str,
    content: bytes,
    content_type: str,
) -> str:
    """Stores uploaded CV file locally in data/uploads/{profile_id}/{filename}."""
    safe_filename = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    target_dir = UPLOADS_DIR / profile_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file = target_dir / safe_filename
    target_file.write_bytes(content)
    return str(target_file)
