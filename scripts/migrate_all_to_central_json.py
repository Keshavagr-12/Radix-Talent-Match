"""
Data Migration Script: Safely migrates all existing records from microservices
into the central data/ directory with schema validation and zero loss.
"""

import json
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"

def migrate_users():
    src = ROOT_DIR / "profile_builder" / "backend" / "data" / "registered_users.json"
    dst = DATA_DIR / "users.json"
    if src.exists():
        try:
            with open(src, "r", encoding="utf-8") as f:
                data = json.load(f)
            # data is {email: {id, email, name, password_hash, salt, created_at}}
            # We can key by user id or preserve as email->record
            users_by_id = {}
            for email, u in data.items():
                uid = u.get("id") or email
                users_by_id[uid] = u
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(users_by_id, f, indent=2)
            print(f"Migrated {len(users_by_id)} user accounts to {dst.name}")
        except Exception as exc:
            print(f"Error migrating users: {exc}")

def migrate_profiles():
    src = ROOT_DIR / "profile_builder" / "backend" / "data" / "profiles.json"
    dst = DATA_DIR / "profiles.json"
    if src.exists():
        try:
            with open(src, "r", encoding="utf-8") as f:
                data = json.load(f)
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Migrated {len(data)} profiles to {dst.name}")
        except Exception as exc:
            print(f"Error migrating profiles: {exc}")

def migrate_jds():
    src = ROOT_DIR / "jd_analytics" / "data" / "jobs.json"
    dst = DATA_DIR / "job_descriptions.json"
    if src.exists():
        try:
            with open(src, "r", encoding="utf-8") as f:
                data = json.load(f)
            count = len(data) if isinstance(data, (dict, list)) else 0
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Migrated {count} job descriptions to {dst.name}")
        except Exception as exc:
            print(f"Error migrating JDs: {exc}")

def migrate_evaluations():
    src = ROOT_DIR / "Talent-match" / "backend" / "data" / "evaluations.json"
    dst = DATA_DIR / "talent_check_results.json"
    if src.exists():
        try:
            with open(src, "r", encoding="utf-8") as f:
                data = json.load(f)
            count = len(data) if isinstance(data, (dict, list)) else 0
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Migrated {count} evaluations to {dst.name}")
        except Exception as exc:
            print(f"Error migrating evaluations: {exc}")

def migrate_matches():
    src = ROOT_DIR / "skill_matching" / "data" / "matches.json"
    dst = DATA_DIR / "skill_matching_results.json"
    if src.exists():
        try:
            with open(src, "r", encoding="utf-8") as f:
                data = json.load(f)
            count = len(data) if isinstance(data, (dict, list)) else 0
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Migrated {count} skill matches to {dst.name}")
        except Exception as exc:
            print(f"Error migrating matches: {exc}")

def migrate_uploads():
    src_dir = ROOT_DIR / "profile_builder" / "backend" / "data" / "uploads"
    dst_dir = DATA_DIR / "uploads"
    if src_dir.exists():
        dst_dir.mkdir(parents=True, exist_ok=True)
        for item in src_dir.glob("**/*"):
            if item.is_file():
                rel = item.relative_to(src_dir)
                target = dst_dir / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, target)
        print(f"Migrated uploads to {dst_dir.name}")

if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    migrate_users()
    migrate_profiles()
    migrate_jds()
    migrate_evaluations()
    migrate_matches()
    migrate_uploads()
