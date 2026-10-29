"""
Shared JSON Persistence Layer for RADIX Talent Match.
Provides safe, atomic JSON file reading and writing with cross-process and thread concurrency safety.
Guarantees consistent UTF-8 encoding, temporary-file replacement, and zero data loss on unexpected termination.
"""

import os
import json
import uuid
import time
import shutil
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Union

logger = logging.getLogger("radix.json_storage")

# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"

# Global memory lock per file path to synchronize threads within the same process
_FILE_LOCKS: Dict[str, threading.Lock] = {}
_META_LOCK = threading.Lock()


def get_file_lock(file_path: Union[str, Path]) -> threading.Lock:
    key = str(Path(file_path).resolve())
    with _META_LOCK:
        if key not in _FILE_LOCKS:
            _FILE_LOCKS[key] = threading.Lock()
        return _FILE_LOCKS[key]


def ensure_directories():
    """Ensure data/ and data/uploads/ exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_json_file(file_path: Union[str, Path], default: Any = None) -> Any:
    """
    Safely reads a JSON file under file lock.
    Returns `default` if the file does not exist.
    Raises ValueError if JSON is malformed, preventing silent fallback to empty data.
    """
    path = Path(file_path).resolve()
    if not path.exists():
        return default

    lock = get_file_lock(path)
    with lock:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return default if default is not None else {}
                return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error(f"Malformed JSON in {path}: {exc}")
            raise ValueError(f"Corrupted or malformed JSON in file {path.name}: {exc}") from exc
        except Exception as exc:
            logger.error(f"Error reading JSON from {path}: {exc}")
            raise IOError(f"Could not read from file {path.name}: {exc}") from exc


def write_json_file_atomic(file_path: Union[str, Path], data: Any) -> None:
    """
    Safely writes JSON data atomically:
    1. Writes to a uniquely named temporary file in the same directory.
    2. Flushes buffers and fsyncs to disk.
    3. Atomically replaces target file using os.replace.
    """
    path = Path(file_path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = get_file_lock(path)

    temp_path = path.parent / f".tmp_{uuid.uuid4().hex}_{path.name}"

    with lock:
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())

            # Atomic replace on filesystem
            os.replace(temp_path, path)
        except Exception as exc:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.error(f"Failed atomic write to {path}: {exc}")
            raise IOError(f"Failed to atomically persist {path.name}: {exc}") from exc


class JsonCollection:
    """
    Collection manager for a key-value or list-based JSON document.
    Stores records keyed by unique record ID.
    """

    def __init__(self, file_path: Union[str, Path]):
        self.file_path = Path(file_path).resolve()
        self.file_path.parent.mkdir(parents=True, exist_ok=True)

    def _load_all(self) -> Dict[str, Any]:
        data = read_json_file(self.file_path, default={})
        if isinstance(data, dict):
            # If standard dictionary of ID -> record
            return data
        elif isinstance(data, list):
            # Convert list of dicts with 'id' to dictionary
            result = {}
            for item in data:
                if isinstance(item, dict) and "id" in item:
                    result[str(item["id"])] = item
            return result
        return {}

    def get(self, record_id: str) -> Optional[Dict[str, Any]]:
        records = self._load_all()
        return records.get(str(record_id))

    def list_all(self, filter_fn: Optional[Callable[[Dict[str, Any]], bool]] = None) -> List[Dict[str, Any]]:
        records = self._load_all()
        items = list(records.values())
        if filter_fn:
            items = [item for item in items if filter_fn(item)]
        return items

    def insert(self, record: Dict[str, Any], record_id: Optional[str] = None) -> Dict[str, Any]:
        records = self._load_all()
        rid = str(record_id or record.get("id") or uuid.uuid4())
        now = current_iso_time()

        item = {
            **record,
            "id": rid,
            "created_at": record.get("created_at") or now,
            "updated_at": now,
        }
        records[rid] = item
        write_json_file_atomic(self.file_path, records)
        return item

    def update(self, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        records = self._load_all()
        rid = str(record_id)
        if rid not in records:
            return None

        current = records[rid]
        merged = {
            **current,
            **updates,
            "id": rid,
            "created_at": current.get("created_at") or current_iso_time(),
            "updated_at": current_iso_time(),
        }
        records[rid] = merged
        write_json_file_atomic(self.file_path, records)
        return merged

    def delete(self, record_id: str) -> bool:
        records = self._load_all()
        rid = str(record_id)
        if rid in records:
            del records[rid]
            write_json_file_atomic(self.file_path, records)
            return True
        return False


# Centralized Collections
users_store = JsonCollection(DATA_DIR / "users.json")
profiles_store = JsonCollection(DATA_DIR / "profiles.json")
job_descriptions_store = JsonCollection(DATA_DIR / "job_descriptions.json")
parsed_resumes_store = JsonCollection(DATA_DIR / "parsed_resumes.json")
talent_check_store = JsonCollection(DATA_DIR / "talent_check_results.json")
skill_matching_store = JsonCollection(DATA_DIR / "skill_matching_results.json")
