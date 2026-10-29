"""
Unit Tests for RADIX Skill Matching Service (Role 5).
Tests exact matching, semantic fuzziness, category adjacency,
gap analysis prioritization, and FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from core.fuzzy_matcher import match_jd_against_candidate
from core.gap_analyzer import build_gap_analysis
from core.profile_loader import list_candidate_profiles
from core.jd_loader import list_extracted_jds

client = TestClient(app)


def test_01_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "skill_matching"
    assert data["port"] == 8005


def test_02_exact_skill_match():
    candidate_skills = [
        {"skill_name": "Python", "category_code": "COD", "evidence": "5 years Python", "proficiency_level": 9},
        {"skill_name": "SQL", "category_code": "SQL", "evidence": "Complex joins and queries", "proficiency_level": 8},
        {"skill_name": "DSA", "category_code": "DSA", "evidence": "Competitive programming", "proficiency_level": 9}
    ]
    jd_skills = [
        {"skill_name": "Python", "category_code": "COD", "evidence": "Required"},
        {"skill_name": "SQL", "category_code": "SQL", "evidence": "Required"},
        {"skill_name": "DSA", "category_code": "DSA", "evidence": "Required"}
    ]

    matched, missing, partial, points = match_jd_against_candidate(
        jd_skills=jd_skills,
        candidate_skills=candidate_skills
    )

    assert len(matched) == 3
    assert len(missing) == 0
    assert len(partial) == 0
    assert points == 30.0


def test_03_prioritize_gap_list_over_number():
    candidate_skills = [
        {"skill_name": "Python", "category_code": "COD", "evidence": "Scripting", "proficiency_level": 7}
    ]
    jd_skills = [
        {"skill_name": "Python", "category_code": "COD", "evidence": "Required", "confidence": "high"},
        {"skill_name": "Kubernetes", "category_code": "CLOUD", "evidence": "Must manage clusters", "confidence": "high"},
        {"skill_name": "Go", "category_code": "COD", "evidence": "High throughput microservices", "confidence": "high"},
        {"skill_name": "Kafka", "category_code": "SYSD", "evidence": "Event streaming", "confidence": "medium"}
    ]

    matched, missing, partial, points = match_jd_against_candidate(
        jd_skills=jd_skills,
        candidate_skills=candidate_skills,
        company="Uber",
        role="Backend Engineer"
    )

    gap_summary = build_gap_analysis(
        jd_skills=jd_skills,
        matched_skills=matched,
        missing_skills=missing,
        partial_skills=partial,
        company="Uber",
        role="Backend Engineer"
    )

    assert len(matched) == 1
    assert len(missing) == 3
    # Check that critical gaps are prioritized
    assert len(gap_summary.critical_gaps) >= 1
    assert len(gap_summary.top_recommendations) >= 2
    for g in gap_summary.critical_gaps:
        assert "gap_explanation" in g
        assert "recommendation" in g


def test_04_semantic_synonym_matching():
    candidate_skills = [
        {"skill_name": "PostgreSQL", "category_code": "SQL", "evidence": "Relational DB schema", "proficiency_level": 8},
        {"skill_name": "Data Structures & Algorithms", "category_code": "DSA", "evidence": "DSA practice", "proficiency_level": 8}
    ]
    jd_skills = [
        {"skill_name": "SQL", "category_code": "SQL", "evidence": "SQL queries required"},
        {"skill_name": "DSA", "category_code": "DSA", "evidence": "Deep DSA knowledge"}
    ]

    matched, missing, partial, points = match_jd_against_candidate(
        jd_skills=jd_skills,
        candidate_skills=candidate_skills
    )

    assert len(matched) == 2
    assert len(missing) == 0


def test_05_partial_adjacent_matching():
    candidate_skills = [
        {"skill_name": "Docker", "category_code": "CLOUD", "evidence": "Containerization", "proficiency_level": 7}
    ]
    jd_skills = [
        {"skill_name": "Kubernetes", "category_code": "CLOUD", "evidence": "Cluster orchestration", "confidence": "high"}
    ]

    matched, missing, partial, points = match_jd_against_candidate(
        jd_skills=jd_skills,
        candidate_skills=candidate_skills
    )

    # Docker is adjacent to Kubernetes in CLOUD category
    assert len(partial) == 1
    assert "CLOUD" in partial[0].similarity_note
    assert points == 5.0


def test_06_api_compare_endpoint():
    payload = {
        "profile": {
            "name": "Integration Test Candidate",
            "skills": [
                {"skill_name": "Python", "category_code": "COD", "evidence": "Python SWE", "proficiency_level": 9},
                {"skill_name": "SQL", "category_code": "SQL", "evidence": "Postgres", "proficiency_level": 8}
            ]
        },
        "jd": {
            "company": "Google LLC",
            "role": "Software Engineer",
            "source_file": "Google_SWE.pdf",
            "skills": [
                {"skill_name": "Python", "category_code": "COD", "evidence": "Required"},
                {"skill_name": "SQL", "category_code": "SQL", "evidence": "Required"},
                {"skill_name": "Rust", "category_code": "COD", "evidence": "Required"}
            ]
        }
    }

    res = client.post("/skill-matching/compare", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["candidate_name"] == "Integration Test Candidate"
    assert data["company"] == "Google LLC"
    assert data["role"] == "Software Engineer"
    assert 0 <= data["match_score"] <= 100
    assert len(data["matched_skills"]) == 2
    assert len(data["missing_skills"]) >= 1
    assert "gap_analysis" in data
    assert data["gap_analysis"]["total_jd_skills"] == 3


def test_07_api_candidates_and_jds_endpoints():
    c_res = client.get("/skill-matching/candidates")
    assert c_res.status_code == 200
    assert isinstance(c_res.json(), list)

    j_res = client.get("/skill-matching/jds")
    assert j_res.status_code == 200
    assert isinstance(j_res.json(), list)


def test_08_api_history_endpoint():
    h_res = client.get("/skill-matching/history")
    assert h_res.status_code == 200
    assert isinstance(h_res.json(), list)
