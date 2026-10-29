from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.talent_check_router import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_talent_check_endpoint():
    response = client.post(
        "/talent-check/check",
        json={
            "company": "Google",
            "candidate": {
                "candidate_id": "candidate-001",
                "skills": [
                    {"category_code": "COD", "level": 6},
                    {"category_code": "DSA", "level": 9},
                    {"category_code": "OOD", "level": 7},
                    {"category_code": "APTI", "level": 6},
                    {"category_code": "COMM", "level": 7},
                    {"category_code": "AI", "level": 5},
                    {"category_code": "CLOUD", "level": 6},
                    {"category_code": "SQL", "level": 5},
                    {"category_code": "SWE", "level": 7},
                    {"category_code": "SYSD", "level": 6},
                    {"category_code": "NETW", "level": 5},
                    {"category_code": "OS", "level": 6}
                ]
            }
        },
    )

    assert response.status_code == 200

    result = response.json()
    assert result["company"] == "Google"
    assert 0 <= result["readiness_score"] <= 100
    assert len(result["skillset_gap"]) == 12
    assert "readiness_status" in result
    assert "readiness_label" in result
    assert "threshold" in result


def test_companies_endpoint():
    response = client.get("/talent-check/companies")
    assert response.status_code == 200
    companies = response.json()
    assert isinstance(companies, list)
    assert len(companies) >= 3

    company_names = [c["company_name"] for c in companies]
    # In-scope companies
    assert any("Google" in name for name in company_names)
    assert any("Microsoft" in name for name in company_names)
    assert any("Oracle" in name for name in company_names)

    # Verify 12 skills structure
    for c in companies:
        assert "expected_skills" in c
        skills = c["expected_skills"]
        for code in ["COD", "DSA", "SYSD", "SWE", "CLOUD", "SQL", "AI", "OS", "NETW", "OOD", "APTI", "COMM"]:
            assert code in skills


def test_three_in_scope_companies_evaluation():
    in_scope = ["Google LLC", "Microsoft Corporation", "Oracle Financial Services Software"]
    candidate_skills = {
        "COD": 8, "DSA": 8, "OOD": 8, "APTI": 8, "COMM": 8,
        "AI": 8, "CLOUD": 8, "SQL": 8, "SWE": 8, "SYSD": 8,
        "NETW": 8, "OS": 8
    }

    for company in in_scope:
        response = client.post(
            "/talent-check/evaluate",
            json={
                "company": company,
                "candidate_skills": candidate_skills
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company"] == company
        assert data["readiness_score"] >= 80.0
        assert data["readiness_status"] == "READY"


def test_readiness_threshold_verdicts():
    # High skills -> READY
    high_skills = {c: 10 for c in ["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"]}
    resp_ready = client.post("/talent-check/check", json={"company": "Google LLC", "candidate_skills": high_skills})
    assert resp_ready.status_code == 200
    assert resp_ready.json()["readiness_status"] == "READY"

    # Moderate skills -> UPSKILLING_RECOMMENDED
    mid_skills = {c: 5.5 for c in ["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"]}
    resp_mid = client.post("/talent-check/check", json={"company": "Google LLC", "candidate_skills": mid_skills})
    assert resp_mid.status_code == 200
    assert resp_mid.json()["readiness_status"] == "UPSKILLING_RECOMMENDED"

    # Low skills -> NEEDS_PREPARATION
    low_skills = {c: 2.0 for c in ["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"]}
    resp_low = client.post("/talent-check/check", json={"company": "Google LLC", "candidate_skills": low_skills})
    assert resp_low.status_code == 200
    assert resp_low.json()["readiness_status"] == "NEEDS_PREPARATION"


def test_evaluations_endpoint():
    response = client.get("/talent-check/evaluations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
