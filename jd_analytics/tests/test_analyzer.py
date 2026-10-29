"""
Unit tests for JD skill analyzer and RADIX classification.
"""

from jd_analytics.analyzer import (
    analyze_job_description,
    fallback_skill_extractor,
    analyze_job_description_rule_based,
)
from jd_analytics.schemas import JobAnalysis


def test_fallback_skill_extractor():
    text = (
        "We are looking for a Senior Backend Engineer proficient in Python, "
        "Data Structures, SQL, Docker on AWS, and Linux operating systems."
    )
    skills = fallback_skill_extractor(text)
    assert len(skills) >= 4

    categories = {s["category_code"] for s in skills}
    assert "COD" in categories
    assert "DSA" in categories
    assert "SQL" in categories
    assert "CLOUD" in categories
    assert "OS" in categories


def test_analyze_job_description_rule_based():
    text = (
        "Company: Netflix\n"
        "Role: Senior Systems Engineer\n"
        "Requirements:\n"
        "- Mastery in Go and Python\n"
        "- High-throughput System Design\n"
        "- Kubernetes container orchestration\n"
        "- Git version control and Unit Testing"
    )
    analysis = analyze_job_description_rule_based(text)
    assert isinstance(analysis, JobAnalysis)
    assert len(analysis.skills) > 0
    skill_names = [s.skill_name.lower() for s in analysis.skills]
    assert any("python" in n for n in skill_names)
    categories = {s.category_code for s in analysis.skills}
    assert "COD" in categories


def test_analyze_job_description_with_groq_or_fallback():
    text = "Hiring Software Engineer at Google LLC. Must know Python, Algorithms, Git, and Azure."
    analysis = analyze_job_description(text)
    assert isinstance(analysis, JobAnalysis)
    assert len(analysis.skills) >= 3
    skill_names = [s.skill_name.lower() for s in analysis.skills]
    assert any("python" in n for n in skill_names)
