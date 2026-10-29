
from core.readiness_service import check_candidate_readiness


def test_candidate_readiness():
    candidate_skills = {
        "COD": 6,
        "DSA": 9,
        "OOD": 7,
        "APTI": 6,
        "COMM": 7,
        "AI": 5,
        "CLOUD": 6,
        "SQL": 5,
        "SWE": 7,
        "SYSD": 6,
        "NETW": 5,
        "OS": 6
    }

    result = check_candidate_readiness("Google", candidate_skills)

    assert result["company"] == "Google"
    assert 0 <= result["readiness_score"] <= 100
    assert len(result["skillset_gap"]) == 12

    for skill in result["skillset_gap"]:
        assert "category_code" in skill
        assert "required_level" in skill
        assert "candidate_level" in skill
        assert "gap" in skill
        assert "gap_amount" in skill
