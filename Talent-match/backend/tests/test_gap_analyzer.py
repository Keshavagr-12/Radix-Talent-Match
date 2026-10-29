
from core.gap_analyzer import analyze_skill_gaps


def test_analyze_skill_gaps():
    candidate_skills = {
        "COD": 6,
        "DSA": 9,
        "SQL": 5
    }

    company_benchmarks = {
        "COD": 8,
        "DSA": 9,
        "SQL": 7
    }

    result = analyze_skill_gaps(candidate_skills, company_benchmarks)

    assert len(result) == 3

    assert result[0]["category_code"] == "COD"
    assert result[0]["gap"] is True
    assert result[0]["gap_amount"] == 2

    assert result[1]["category_code"] == "DSA"
    assert result[1]["gap"] is False
    assert result[1]["gap_amount"] == 0

    assert result[2]["category_code"] == "SQL"
    assert result[2]["gap"] is True
    assert result[2]["gap_amount"] == 2
