"""
Deterministic Fuzzy & Category-Aware Skill Matcher.
Handles real-world variation in skill descriptions through:
1. Exact and normalized token overlap
2. Technology domain synonyms and ontology
3. RADIX category-level adjacent competency matching
4. High-depth explanations for gaps and partial matches
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple
try:
    from skill_matching.models.schemas import PartialMatchItem
except ImportError:
    from models.schemas import PartialMatchItem

STOP_WORDS = {
    "and", "or", "the", "in", "for", "with", "to", "of", "basic", "basics",
    "core", "advanced", "production", "programming", "development", "stack",
    "framework", "knowledge", "experience", "proficient", "understanding",
    "architect", "design", "build", "deep", "write", "scalable"
}

TECH_SYNONYMS: Dict[str, Set[str]] = {
    "python": {"python", "py", "python3"},
    "c++": {"c++", "cpp", "c/c++"},
    "c": {"c", "c/c++"},
    "java": {"java", "jvm"},
    "go": {"go", "golang"},
    "rust": {"rust", "cargo"},
    "sql": {"sql", "mysql", "postgresql", "postgres", "sqlite", "relational database", "rdbms"},
    "postgresql": {"postgresql", "postgres"},
    "dsa": {"dsa", "data structures", "algorithms", "data structures & algorithms", "data structures and algorithms"},
    "docker": {"docker", "dockerfile", "docker compose"},
    "kubernetes": {"kubernetes", "k8s"},
    "aws": {"aws", "amazon web services"},
    "gcp": {"gcp", "google cloud platform"},
    "linux": {"linux", "unix", "posix"},
    "multithreading": {"multithreading", "concurrency", "multithreaded"},
    "git": {"git", "github", "gitlab", "version control"},
    "ood": {"object-oriented design", "ood", "oop", "object oriented design"},
    "rest": {"rest", "restful", "rest api"}
}


def normalize_text(text: str) -> str:
    """Normalize text by lowering, removing punctuation except +, #, /."""
    cleaned = re.sub(r"[^a-zA-Z0-9+#/]", " ", str(text).lower())
    return " ".join(cleaned.split())


def tokenize(text: str) -> Set[str]:
    """Tokenize and remove stop words."""
    cleaned = re.sub(r"[^a-zA-Z0-9+#/]", " ", str(text).lower())
    tokens = {w for w in cleaned.split() if w and w not in STOP_WORDS}
    return tokens


def check_synonym_match(s1: str, s2: str) -> bool:
    """Check if s1 and s2 share a known tech synonym cluster."""
    t1 = normalize_text(s1)
    t2 = normalize_text(s2)

    for cluster_key, group in TECH_SYNONYMS.items():
        in_group_1 = any(term in t1 for term in group) or t1 in group
        in_group_2 = any(term in t2 for term in group) or t2 in group
        if in_group_1 and in_group_2:
            return True
    return False


def match_jd_against_candidate(
    jd_skills: List[Dict[str, Any]],
    candidate_skills: List[Dict[str, Any]],
    company: str = "Target Company",
    role: str = "Software Engineer"
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[PartialMatchItem], float]:
    """
    Perform deterministic fuzzy & category-aware matching.
    Returns (matched_skills, missing_skills, partial_skills, earned_points).
    """
    matched_skills: List[Dict[str, Any]] = []
    missing_skills: List[Dict[str, Any]] = []
    partial_skills: List[PartialMatchItem] = []
    earned_points = 0.0

    # Index candidate skills by category
    cand_by_cat: Dict[str, List[Dict[str, Any]]] = {}
    for cs in candidate_skills:
        cat = str(cs.get("category_code", "OTHER")).upper()
        cand_by_cat.setdefault(cat, []).append(cs)

    for js in jd_skills:
        js_name = str(js.get("skill_name", "")).strip()
        js_cat = str(js.get("category_code", "OTHER")).upper()
        js_tokens = tokenize(js_name)
        norm_js = normalize_text(js_name)

        best_match = None
        match_type = "none"
        match_note = ""

        # Tier 1: Exact Name Match
        for cs in candidate_skills:
            cs_name = str(cs.get("skill_name", "")).strip()
            norm_cs = normalize_text(cs_name)

            if norm_js == norm_cs:
                best_match = cs
                match_type = "exact"
                match_note = f"Verified exact candidate skill: {cs_name}"
                break

        # Tier 2: Synonym / Ontology Match
        if match_type == "none":
            for cs in candidate_skills:
                cs_name = str(cs.get("skill_name", "")).strip()
                if check_synonym_match(js_name, cs_name):
                    best_match = cs
                    match_type = "semantic"
                    match_note = f"Semantic match: '{cs_name}' aligns directly with JD requirement '{js_name}'"
                    break

        # Tier 3: Token Overlap in Same Category
        if match_type == "none":
            for cs in candidate_skills:
                cs_name = str(cs.get("skill_name", "")).strip()
                cs_cat = str(cs.get("category_code", "OTHER")).upper()
                cs_tokens = tokenize(cs_name)

                if js_cat == cs_cat and js_tokens and cs_tokens and (js_tokens & cs_tokens):
                    best_match = cs
                    match_type = "token"
                    match_note = f"Token overlap within {js_cat}: '{cs_name}' matches requirement keyword"
                    break

        # Tier 4: Category Adjacent Competency Check (Partial Match)
        if match_type == "none" and js_cat in cand_by_cat:
            cat_candidates = cand_by_cat[js_cat]
            if cat_candidates:
                alt = cat_candidates[0]
                alt_level = float(alt.get("proficiency_level") or alt.get("level") or 7.0)
                if alt_level >= 6.0:
                    best_match = alt
                    match_type = "partial"
                    match_note = (
                        f"Demonstrated {js_cat} competency via '{alt.get('skill_name')}'. "
                        f"Adjacent foundation present, but direct evidence for '{js_name}' is missing."
                    )

        # Classify result
        if match_type in ("exact", "semantic", "token") and best_match:
            cand_lvl = best_match.get("proficiency_level") or best_match.get("level") or 8
            matched_skills.append({
                "skill_name": js_name,
                "category_code": js_cat,
                "evidence": best_match.get("evidence") or js.get("evidence") or f"Candidate demonstrated {js_name}",
                "confidence": js.get("confidence", "high"),
                "proficiency_level": cand_lvl,
                "match_type": match_type,
                "match_explanation": match_note
            })
            earned_points += 10.0

        elif match_type == "partial" and best_match:
            partial_item = PartialMatchItem(
                jd_skill=js,
                candidate_skill=best_match,
                similarity_note=match_note,
                gap_explanation=f"Found foundational competency in {js_cat} via {best_match.get('skill_name')}, but requires {js_name}."
            )
            partial_skills.append(partial_item)

            # In accordance with gap prioritization and frontend contract,
            # partial matches are also surfaced in missing skills with high-detail gap advice
            missing_item = dict(js)
            missing_item["gap_explanation"] = match_note
            missing_item["recommendation"] = f"Expand from {best_match.get('skill_name')} to hands-on tooling in {js_name}."
            missing_skills.append(missing_item)
            earned_points += 5.0

        else:
            # Completely missing
            missing_item = dict(js)
            missing_item["gap_explanation"] = (
                f"Required competency for {role} at {company}. "
                f"Candidate profile contains no demonstrated skill or project in {js_name} ({js_cat})."
            )
            missing_item["recommendation"] = (
                f"Complete a project or technical coursework demonstrating {js_name} ({js_cat}) "
                f"and record repository evidence in Profile Builder."
            )
            missing_skills.append(missing_item)

    return matched_skills, missing_skills, partial_skills, earned_points
