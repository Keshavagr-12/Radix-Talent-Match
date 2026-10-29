"""
Gap Analyzer for RADIX Skill Matching.
Prioritizes the gap list over raw numbers:
Analyzes missing skills and partial matches to provide actionable explanations,
severity categorization, and job-specific preparation recommendations.
"""

from typing import Any, Dict, List
try:
    from skill_matching.models.schemas import GapAnalysisSummary
except ImportError:
    from models.schemas import GapAnalysisSummary

CATEGORY_TITLES = {
    "COD": "Core Coding & Language Fluency",
    "DSA": "Data Structures & Algorithms",
    "OOD": "Object-Oriented Design & System Architecture",
    "APTI": "Problem Solving & Analytical Reasoning",
    "COMM": "Technical Communication & Collaboration",
    "AI": "AI / Machine Learning & Data Engineering",
    "CLOUD": "Cloud Infrastructure, Containers & DevOps",
    "SQL": "Relational Databases & Data Modeling",
    "SWE": "Software Engineering Practices & CI/CD",
    "SYSD": "Distributed Systems & High-Throughput Architecture",
    "NETW": "Computer Networking & Protocols",
    "OS": "Operating Systems & Concurrency",
    "OTHER": "Domain-Specific Technical Skills"
}


def build_gap_analysis(
    jd_skills: List[Dict[str, Any]],
    matched_skills: List[Dict[str, Any]],
    missing_skills: List[Dict[str, Any]],
    partial_skills: List[Any],
    company: str = "Target Company",
    role: str = "Software Engineer"
) -> GapAnalysisSummary:
    """
    Construct a comprehensive, prioritized gap analysis breakdown.
    Prioritizes high-impact missing skills first.
    """
    critical_gaps: List[Dict[str, Any]] = []
    moderate_gaps: List[Dict[str, Any]] = []

    # Map partial JD skill names for easy check
    partial_names = set()
    for p in partial_skills:
        jd_s = p.jd_skill if hasattr(p, "jd_skill") else p.get("jd_skill", {})
        s_name = str(jd_s.get("skill_name", "")).strip().lower()
        if s_name:
            partial_names.add(s_name)

    for ms in missing_skills:
        name = str(ms.get("skill_name", "")).strip()
        cat_code = str(ms.get("category_code", "OTHER")).upper()
        confidence = str(ms.get("confidence", "high")).lower()
        evidence = ms.get("evidence", "Required competency in job description.")
        cat_title = CATEGORY_TITLES.get(cat_code, cat_code)

        is_partial = name.lower() in partial_names

        # Build gap item
        gap_item = {
            "skill_name": name,
            "category_code": cat_code,
            "category_title": cat_title,
            "confidence": confidence,
            "evidence": evidence,
            "is_partial": is_partial,
            "gap_severity": "Critical" if (confidence == "high" and not is_partial) else "Moderate",
            "gap_explanation": ms.get("gap_explanation") or (
                f"Identified as a core requirement for {role} at {company}. "
                f"No verified project, internship, or skill tag found in candidate profile."
                if not is_partial else
                f"Candidate has adjacent foundational skills in {cat_title}, but lacks direct demonstrated tooling in {name}."
            ),
            "recommendation": ms.get("recommendation") or (
                f"Build a focused project or practical assignment demonstrating {name} ({cat_code}) "
                f"and add concrete performance/code evidence into Profile Builder."
            )
        }

        if gap_item["gap_severity"] == "Critical":
            critical_gaps.append(gap_item)
        else:
            moderate_gaps.append(gap_item)

    # Sort critical gaps so the most impactful ones appear first
    critical_gaps.sort(key=lambda x: (x["category_code"], x["skill_name"]))

    # Generate top prioritized recommendations
    top_recommendations: List[str] = []
    for g in critical_gaps[:3]:
        top_recommendations.append(
            f"Prioritize building project evidence for {g['skill_name']} ({g['category_code']}): {g['evidence']}"
        )
    for g in moderate_gaps[:2]:
        if len(top_recommendations) < 4:
            top_recommendations.append(
                f"Bridge adjacent gap in {g['skill_name']} ({g['category_code']}) by reviewing posting expectations: {g['evidence']}"
            )

    if not top_recommendations and not missing_skills:
        top_recommendations.append(
            f"Candidate profile demonstrates 100% coverage across all extracted requirements for {role} at {company}!"
        )

    return GapAnalysisSummary(
        total_jd_skills=len(jd_skills),
        matched_count=len(matched_skills),
        missing_count=len(missing_skills),
        partial_count=len(partial_skills),
        critical_gaps=critical_gaps,
        moderate_gaps=moderate_gaps,
        top_recommendations=top_recommendations
    )
