"""
Converts authoritative company_skill_levels_staging.csv into company_skill_levels_staging.json
Maps each company across the 12 RADIX categories (both numeric 1-10 levels and Bloom descriptor tiers).
"""

import csv
import json
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "data" / "company_skill_levels_staging.csv"
JSON_PATH = ROOT_DIR / "data" / "company_skill_levels_staging.json"

COLUMN_MAP = {
    "coding": "COD",
    "data_structures_and_algorithms": "DSA",
    "object_oriented_programming_and_design": "OOD",
    "aptitude_and_problem_solving": "APTI",
    "communication_skills": "COMM",
    "ai_native_engineering": "AI",
    "devops_and_cloud": "CLOUD",
    "sql_and_design": "SQL",
    "software_engineering": "SWE",
    "system_design_and_architecture": "SYSD",
    "computer_networking": "NETW",
    "operating_system": "OS",
}

def parse_val(raw_val: str):
    raw = str(raw_val).strip()
    match = re.match(r"^(\d+)\s*[-–—]\s*([A-Za-z]+)$", raw)
    if match:
        lvl = float(match.group(1))
        tier = match.group(2).upper()
        return lvl, tier
    # Try digits only
    digits = re.findall(r"\d+", raw)
    if digits:
        return float(digits[0]), "AP"
    return 5.0, "AP"

def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing {CSV_PATH}")

    companies_dict = {}
    raw_rows = []

    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = int(row.get("id") or 0)
            cname = (row.get("companies") or "").strip()
            if not cname:
                continue

            raw_rows.append(row)

            skill_levels = {}
            skill_descriptors = {}
            total_score = 0.0

            for col, code in COLUMN_MAP.items():
                val_str = row.get(col, "5-AP")
                lvl, tier = parse_val(val_str)
                skill_levels[code] = lvl
                skill_descriptors[code] = f"{int(lvl)}-{tier}"
                total_score += lvl

            avg_score = total_score / 12.0
            
            # Tier descriptor derived from avg level
            if avg_score >= 8.0:
                tier_desc = "Tier 1 Elite Engineering & Research"
            elif avg_score >= 6.5:
                tier_desc = "Tier 1 Global Product Enterprise"
            elif avg_score >= 5.0:
                tier_desc = "Tier 2 Scaled Enterprise & Fintech"
            else:
                tier_desc = "Core Engineering Benchmark Tier"

            # Derive short name
            short_name = cname
            for suffix in [" (Subsidiary of Alphabet Inc.)", " Limited", " Private Limited", " Inc.", ", Inc.", " plc", " PLC", " Ltd.", " Corporation", " Corp", " SE"]:
                short_name = short_name.replace(suffix, "")
            short_name = short_name.strip()

            companies_dict[cname] = {
                "id": cid,
                "company": cname,
                "shortName": short_name,
                "tierDescriptor": tier_desc,
                "headquarters": "Global Operations",
                "evaluationSummary": f"Authoritative 12-category competency benchmark for {cname} (Average Bar: {avg_score:.1f}/10).",
                "readinessThreshold": 80 if avg_score >= 7.0 else 75,
                "expectedLevels": skill_levels,
                "expectedDescriptors": skill_descriptors,
            }

    data = {
        "version": "1.0",
        "authoritative_source": "company_skill_levels_staging.csv",
        "total_companies": len(companies_dict),
        "companies": companies_dict,
        "raw_rows": raw_rows,
    }

    with open(JSON_PATH, mode="w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Successfully generated {JSON_PATH} with {len(companies_dict)} companies.")

if __name__ == "__main__":
    main()
