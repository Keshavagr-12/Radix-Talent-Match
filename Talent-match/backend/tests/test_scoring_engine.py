
from core.scoring_engine import calculate_readiness_score


def test_calculate_readiness_score():
    skillset_gap = [
        {
            "category_code": "COD",
            "required_level": 8,
            "candidate_level": 6,
            "gap": True,
            "gap_amount": 2
        },
        {
            "category_code": "DSA",
            "required_level": 9,
            "candidate_level": 9,
            "gap": False,
            "gap_amount": 0
        },
        {
            "category_code": "SQL",
            "required_level": 7,
            "candidate_level": 5,
            "gap": True,
            "gap_amount": 2
        }
    ]

    result = calculate_readiness_score(skillset_gap)

    assert result == 83.33


def test_empty_skillset_returns_zero():
    assert calculate_readiness_score([]) == 0.0
