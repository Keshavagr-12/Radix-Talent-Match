import sys
import os
import importlib.util
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent.parent

def load_app(module_name: str, file_path: Path):
    sys.path.insert(0, str(file_path.parent))
    spec = importlib.util.spec_from_file_location(module_name, str(file_path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return getattr(mod, "app")

# Load each app cleanly
jd_app = load_app("jd_api_app", ROOT_DIR / "jd_analytics" / "api.py")
resume_app = load_app("resume_api_app", ROOT_DIR / "resume-parsing-llm" / "app" / "main.py")
profile_app = load_app("profile_api_app", ROOT_DIR / "profile_builder" / "backend" / "main.py")
talent_app = load_app("talent_api_app", ROOT_DIR / "Talent-match" / "backend" / "main.py")
skill_matching_app = load_app("skill_api_app", ROOT_DIR / "skill_matching" / "main.py")


# -------------------------------------------------------------
# 1. HEALTH CHECKS
# -------------------------------------------------------------
def test_01_jd_analytics_health():
    client = TestClient(jd_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "jd_analytics"
    assert data["port"] == 8001


def test_02_resume_parsing_health():
    client = TestClient(resume_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "resume_parsing"
    assert data["port"] == 8002


def test_03_profile_builder_health():
    client = TestClient(profile_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "profile_builder"
    assert data["port"] == 8003


def test_04_talent_check_health():
    client = TestClient(talent_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "talent_check"
    assert data["port"] == 8004


def test_05_skill_matching_health():
    client = TestClient(skill_matching_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "skill_matching"
    assert data["port"] == 8005


# -------------------------------------------------------------
# 2. INDIVIDUAL MODULE ENDPOINTS
# -------------------------------------------------------------
def test_06_jd_analytics_sample_list():
    client = TestClient(jd_app)
    response = client.get("/jd-analytics/list")
    assert response.status_code == 200
    jds = response.json()
    assert isinstance(jds, list)
    assert len(jds) >= 3
    assert any("Google" in jd.get("company", "") for jd in jds)


def test_07_jd_analytics_text_extraction():
    client = TestClient(jd_app)
    sample_text = """
    Software Engineer at Google LLC.
    Responsibilities:
    - Build distributed backend microservices using Python, C++, and Go.
    - Deep knowledge of Data Structures and Algorithms (DSA), trees, graphs, and dynamic programming.
    - Architect scalable systems with Linux, Docker, and Cloud infrastructure.
    - Write robust SQL queries for PostgreSQL databases.
    """
    response = client.post(
        "/jd-analytics/extract",
        data={"raw_text": sample_text, "company": "Google LLC", "role": "Software Engineer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "jd"
    assert data["company"] == "Google LLC"
    assert len(data["skills"]) > 0
    categories = [s["category_code"] for s in data["skills"]]
    assert "COD" in categories or "DSA" in categories


def test_08_resume_parsing_sample():
    client = TestClient(resume_app)
    response = client.post(
        "/resume-parsing/extract",
        data={"sample_candidate_id": "candidate-ananya-rao"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_name"] == "Ananya Rao"
    assert data["source_type"] == "resume"
    assert len(data["skills"]) >= 5


def test_09_profile_builder_create_and_get():
    client = TestClient(profile_app)
    profile_payload = {
        "name": "Integration Test Candidate",
        "email": "integration.test@example.com",
        "education": "B.Tech in Computer Science",
        "skills": [
            {"skill_name": "Python", "category_code": "COD", "evidence": "Expert in Python", "confidence": "high", "level": 9.0},
            {"skill_name": "DSA", "category_code": "DSA", "evidence": "Solved 400 problems", "confidence": "high", "level": 8.0},
            {"skill_name": "SQL", "category_code": "SQL", "evidence": "PostgreSQL queries", "confidence": "high", "level": 8.0}
        ],
        "preferred_roles": ["Software Engineer"]
    }
    create_res = client.post("/api/profiles", json=profile_payload)
    assert create_res.status_code in (201, 200, 409)
    if create_res.status_code != 409:
        profile_id = create_res.json()["id"]
        get_res = client.get(f"/api/profiles/{profile_id}")
        assert get_res.status_code == 200
        assert get_res.json()["profile"]["name"] == "Integration Test Candidate"


def test_10_talent_check_evaluate():
    client = TestClient(talent_app)
    request_data = {
        "company": "Google LLC",
        "candidate": {
            "candidate_id": "test-cand-001",
            "skills": [
                {"category_code": "COD", "level": 8.0},
                {"category_code": "DSA", "level": 9.0},
                {"category_code": "OOD", "level": 7.0},
                {"category_code": "SQL", "level": 7.0},
                {"category_code": "SWE", "level": 8.0},
                {"category_code": "OS", "level": 8.0}
            ]
        }
    }
    response = client.post("/talent-check/evaluate", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "readiness_score" in data
    assert 0 <= data["readiness_score"] <= 100
    assert len(data["skillset_gap"]) > 0


def test_11_skill_matching_compare():
    client = TestClient(skill_matching_app)
    compare_payload = {
        "profile": {
            "name": "Ananya Rao",
            "skills": [
                {"skill_name": "Python", "category_code": "COD", "evidence": "Experienced", "proficiency_level": 9},
                {"skill_name": "Data Structures", "category_code": "DSA", "evidence": "Experienced", "proficiency_level": 9},
                {"skill_name": "Docker", "category_code": "CLOUD", "evidence": "Containerization", "proficiency_level": 8}
            ]
        },
        "jd": {
            "company": "Google LLC",
            "role": "Software Engineer",
            "source_file": "Google_SWE_JD.pdf",
            "skills": [
                {"skill_name": "Python", "category_code": "COD", "evidence": "Required"},
                {"skill_name": "Data Structures", "category_code": "DSA", "evidence": "Required"},
                {"skill_name": "Kubernetes", "category_code": "CLOUD", "evidence": "Required"},
                {"skill_name": "Rust", "category_code": "COD", "evidence": "Required"}
            ]
        }
    }
    response = client.post("/skill-matching/compare", json=compare_payload)
    assert response.status_code == 200
    result = response.json()
    assert 0 <= result["match_score"] <= 100
    assert len(result["matched_skills"]) >= 2
    assert len(result["missing_skills"]) >= 1


# -------------------------------------------------------------
# 3. COMPLETE 5-STAGE WORKFLOW INTEGRATION TEST
# -------------------------------------------------------------
def test_12_complete_sequential_workflow():
    """
    Tests the exact sequence:
    JD -> Resume Parsing -> Profile Builder -> Talent Check -> Skill Matching -> Final Results
    """
    # STAGE 1: Analyze Job Description
    jd_client = TestClient(jd_app)
    jd_resp = jd_client.post(
        "/jd-analytics/extract",
        data={
            "raw_text": "Looking for a Software Engineer proficient in Python, DSA, SQL, and Cloud Systems.",
            "company": "Microsoft Corporation",
            "role": "Software Engineer"
        }
    )
    assert jd_resp.status_code == 200
    jd_result = jd_resp.json()
    assert len(jd_result["skills"]) > 0

    # STAGE 2: Parse Candidate Resume
    resume_client = TestClient(resume_app)
    resume_resp = resume_client.post(
        "/resume-parsing/extract",
        data={"sample_candidate_id": "candidate-rohan-verma"}
    )
    assert resume_resp.status_code == 200
    resume_result = resume_resp.json()
    assert len(resume_result["skills"]) > 0

    # STAGE 3: Build & Save Candidate Profile
    profile_client = TestClient(profile_app)
    profile_payload = {
        "name": resume_result["candidate_name"],
        "email": resume_result["candidate_email"],
        "education": "Delhi Technological University (DTU)",
        "skills": [
            {
                "skill_name": s["skill_name"],
                "category_code": s["category_code"],
                "evidence": s["evidence"],
                "confidence": s["confidence"],
                "level": float(s.get("proficiency_level", 7.0))
            }
            for s in resume_result["skills"]
        ],
        "preferred_roles": resume_result.get("preferred_roles", ["Software Engineer"])
    }
    prof_resp = profile_client.post("/api/profiles", json=profile_payload)
    assert prof_resp.status_code in (200, 201, 409)

    # STAGE 4: Run Talent Check against Microsoft Corporation
    talent_client = TestClient(talent_app)
    tc_resp = talent_client.post(
        "/talent-check/evaluate",
        json={
            "company": "Microsoft Corporation",
            "candidate": {
                "candidate_id": "rohan-001",
                "skills": [
                    {"category_code": s["category_code"], "level": s["level"]}
                    for s in profile_payload["skills"]
                ]
            }
        }
    )
    assert tc_resp.status_code == 200
    tc_result = tc_resp.json()
    assert "readiness_score" in tc_result
    assert tc_result["readiness_score"] > 0

    # STAGE 5: Run Skill Matching against Analyzed JD
    match_client = TestClient(skill_matching_app)
    match_resp = match_client.post(
        "/skill-matching/compare",
        json={
            "profile": {
                "name": profile_payload["name"],
                "email": profile_payload["email"],
                "skills": profile_payload["skills"]
            },
            "jd": jd_result
        }
    )
    assert match_resp.status_code == 200
    match_result = match_resp.json()
    assert "match_score" in match_result
    assert "matched_skills" in match_result
    assert "missing_skills" in match_result
    assert len(match_result["matched_skills"]) > 0

    print("\n[SUCCESS] 5-Stage Sequential Workflow Verified End-to-End!")
    print(f"  JD: {jd_result['role']} at {jd_result['company']}")
    print(f"  Candidate: {profile_payload['name']} ({len(profile_payload['skills'])} skills)")
    print(f"  Talent Check Readiness: {tc_result['readiness_score']}/100")
    print(f"  Skill Match Score: {match_result['match_score']}/100")
    print(f"  Matched Skills: {len(match_result['matched_skills'])}, Missing Skills: {len(match_result['missing_skills'])}")


if __name__ == "__main__":
    pytest.main(["-v", __file__])
