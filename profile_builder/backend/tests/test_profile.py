from io import BytesIO
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "profile_builder"


def test_home_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Profile Builder API is running" in response.json()["message"]


def test_list_profiles_endpoint():
    response = client.get("/api/profiles")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_profile_invalid_uuid():
    response = client.get("/api/profiles/not-a-valid-uuid")
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found."


def test_get_profile_non_existent_uuid():
    response = client.get("/api/profiles/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found."


def test_create_profile_invalid_email():
    payload = {
        "name": "Test User",
        "email": "not-an-email",
        "skills": [],
        "education": [],
        "hackathons": [],
        "internships": [],
        "certifications": [],
        "preferred_roles": [],
    }
    response = client.post("/api/profiles", json=payload)
    assert response.status_code == 422


def test_create_profile_name_too_short():
    payload = {
        "name": "A",
        "email": "test@example.com",
    }
    response = client.post("/api/profiles", json=payload)
    assert response.status_code == 422


def test_upload_resume_invalid_extension():
    files = {"file": ("resume.txt", BytesIO(b"Hello world"), "text/plain")}
    response = client.post("/api/profiles/resume", files=files)
    assert response.status_code == 400
    assert "Only PDF and DOCX resumes are supported." in response.json()["detail"]


def test_upload_resume_empty_file():
    files = {"file": ("resume.pdf", BytesIO(b""), "application/pdf")}
    response = client.post("/api/profiles/resume", files=files)
    assert response.status_code == 400
    assert "The uploaded resume is empty." in response.json()["detail"]


def test_update_profile_invalid_uuid():
    response = client.put("/api/profiles/invalid-uuid", json={"name": "New Name"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found."


def test_update_profile_empty_body():
    response = client.put("/api/profiles/00000000-0000-0000-0000-000000000000", json={})
    assert response.status_code == 400
    assert "At least one field must be provided" in response.json()["detail"]
