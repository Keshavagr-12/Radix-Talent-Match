
import pytest
from pydantic import ValidationError

from app.schemas.profile_schema import ProfileCreate


def test_valid_profile():
    profile = ProfileCreate(
        name="Ananya Rao",
        email="ananya@example.com",
        preferred_roles=["Software Engineer"],
    )

    assert profile.name == "Ananya Rao"
    assert profile.skills == []


def test_invalid_email():
    with pytest.raises(ValidationError):
        ProfileCreate(
            name="Ananya Rao",
            email="not-an-email",
        )


def test_invalid_skill_category():
    with pytest.raises(ValidationError):
        ProfileCreate(
            name="Ananya Rao",
            email="ananya@example.com",
            skills=[
                {
                    "skill_name": "Python",
                    "category_code": "INVALID",
                    "evidence": "Python project",
                    "confidence": "high",
                }
            ],
        )
