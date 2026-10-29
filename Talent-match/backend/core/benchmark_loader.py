"""
Authoritative Benchmark loader for RADIX Talent Check.
Loads 12-skillset expectations directly from the authoritative dataset
data/company_skill_levels_staging.json (and fallback data/company_skillsets.json).
Eliminates all Supabase dependencies.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("talent_check.loader")

_current_file = Path(__file__).resolve()
ROOT_DIR = _current_file.parents[3] if len(_current_file.parents) > 3 else _current_file.parents[2]

AUTHORITATIVE_FILE = ROOT_DIR / "data" / "company_skill_levels_staging.json"
LOCAL_SNAPSHOT_FILE = (
    _current_file.parent.parent
    / "data"
    / "company_skillsets.json"
)


def load_authoritative_staging() -> Dict[str, Any]:
    """Load the authoritative 116-company staging JSON."""
    if AUTHORITATIVE_FILE.exists():
        try:
            with open(AUTHORITATIVE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning(f"Error reading authoritative staging file: {exc}")
    return {}


def load_local_snapshot() -> Dict[str, Any]:
    """Load local snapshot JSON file."""
    if not LOCAL_SNAPSHOT_FILE.exists():
        return {}

    try:
        with LOCAL_SNAPSHOT_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as exc:
        logger.warning(f"Error reading local snapshot: {exc}")
        return {}


def load_benchmarks() -> Dict[str, Any]:
    """
    Load company skill benchmarks across all companies.
    Sources directly from authoritative company_skill_levels_staging.json,
    merged with local snapshot.
    """
    companies: Dict[str, Dict[str, float]] = {}

    # 1. Authoritative staging JSON
    staging_data = load_authoritative_staging()
    if staging_data and "companies" in staging_data:
        for c_name, c_info in staging_data["companies"].items():
            if isinstance(c_info, dict) and "expectedLevels" in c_info:
                companies[c_name] = c_info["expectedLevels"]
            elif isinstance(c_info, dict):
                companies[c_name] = c_info

    # 2. Local snapshot
    local_data = load_local_snapshot()
    local_companies = local_data.get("companies", {})
    for c_name, skills in local_companies.items():
        if c_name not in companies:
            companies[c_name] = skills

    return {"companies": companies}


def get_company_benchmarks_with_source(company_name: str) -> Tuple[Dict[str, float], str]:
    """
    Return the selected company's benchmark expectations across all 12 RADIX categories
    along with source indicator.
    """
    if not company_name or not isinstance(company_name, str) or not company_name.strip():
        raise ValueError("Company name cannot be empty.")

    cleaned_name = company_name.strip()
    target_cf = cleaned_name.casefold()

    # 1. Check Authoritative Staging JSON
    staging = load_authoritative_staging()
    if staging and "companies" in staging:
        staged_companies = staging["companies"]

        # Exact match
        for name, c_info in staged_companies.items():
            if name.casefold() == target_cf:
                return c_info.get("expectedLevels", c_info), "authoritative:company_skill_levels_staging"

        # Case-insensitive substring match
        for name, c_info in staged_companies.items():
            if target_cf in name.casefold() or name.casefold() in target_cf:
                return c_info.get("expectedLevels", c_info), "authoritative:company_skill_levels_staging"

    # 2. Check Local Snapshot
    local_data = load_local_snapshot()
    companies = local_data.get("companies", local_data)

    # Direct match
    for name, benchmarks in companies.items():
        if name.casefold() == target_cf:
            return benchmarks, "local_snapshot"

    # Alias match
    alias_map = {
        "oracle fss": "Oracle Financial Services Software",
        "oracle financial": "Oracle Financial Services Software",
        "oracle india": "Oracle India Private Limited",
        "google inc": "Google LLC (Subsidiary of Alphabet Inc.)",
        "google": "Google LLC (Subsidiary of Alphabet Inc.)",
        "google llc": "Google LLC (Subsidiary of Alphabet Inc.)",
        "msft": "Microsoft Corporation",
        "microsoft": "Microsoft Corporation",
        "apple": "Apple Inc.",
        "amazon": "Amazon.com, Inc.",
        "tcs": "Tata Consultancy Services Limited",
        "infosys": "Infosys Limited",
        "meta": "Meta Platforms",
        "uber": "Uber Technologies, Inc.",
        "cisco": "Cisco Systems, Inc.",
    }
    mapped_name = alias_map.get(target_cf)
    if mapped_name:
        # Check authoritative staging first
        if staging and "companies" in staging and mapped_name in staging["companies"]:
            c_info = staging["companies"][mapped_name]
            return c_info.get("expectedLevels", c_info), "authoritative:company_skill_levels_staging"
        if mapped_name in companies:
            return companies[mapped_name], "local_snapshot"

    for name, benchmarks in companies.items():
        first_word = target_cf.split()[0]
        if first_word and (name.casefold().startswith(first_word) or target_cf.startswith(name.casefold().split()[0])):
            return benchmarks, "local_snapshot"

    raise ValueError(
        f"No benchmark data found for company '{company_name}' in authoritative staging dataset or local snapshot."
    )


def get_company_benchmarks(company_name: str) -> Dict[str, float]:
    """
    Return the selected company's benchmark expectations as a dictionary.
    Guarantees backward compatibility with existing tests and modules.
    """
    benchmarks, _ = get_company_benchmarks_with_source(company_name)
    return benchmarks
