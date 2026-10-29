import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR / "profile_builder" / "backend"))

from main import app as profile_app

client = TestClient(profile_app)


def test_auth_signup_validation():
    """Verify signup rejects invalid email and short password."""
    # Invalid email
    resp = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "pass"})
    assert resp.status_code == 422

    # Short password (< 6 chars)
    resp = client.post("/api/auth/signup", json={"email": "valid@example.com", "password": "123"})
    assert resp.status_code == 422


def test_auth_login_invalid_credentials():
    """Verify login against local user store rejects invalid credentials with 401."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "nonexistent_user_for_test@example.com", "password": "WrongPassword123!"}
    )
    assert resp.status_code in (401, 400)


def test_auth_session_unauthorized():
    """Verify accessing session without token returns 401."""
    resp = client.get("/api/auth/session")
    assert resp.status_code == 401

    resp = client.get("/api/auth/session", headers={"Authorization": "Bearer invalid_token"})
    assert resp.status_code == 401


def test_auth_login_successful_with_demo_candidate():
    """Verify login with seeded test candidate credentials succeeds and returns valid JWT token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "rohan.verma@radix.ai", "password": "Password123!"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"] is not None
    assert data["user"]["email"] == "rohan.verma@radix.ai"
    assert data["user"]["name"] == "Rohan Verma"

    # Verify session using this token
    token = data["access_token"]
    session_resp = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert session_resp.status_code == 200
    assert session_resp.json()["authenticated"] is True
    assert session_resp.json()["user"]["email"] == "rohan.verma@radix.ai"


def test_auth_signup_and_immediate_login():
    """Verify new user signup issues token and allows immediate authenticated access."""
    import time
    unique_email = f"candidate_{int(time.time())}@radix.ai"
    signup_resp = client.post(
        "/api/auth/signup",
        json={"name": "New Candidate", "email": unique_email, "password": "Password123!"}
    )
    assert signup_resp.status_code == 201
    signup_data = signup_resp.json()
    assert signup_data["access_token"] is not None
    assert signup_data["user"]["email"] == unique_email

    # Verify logging in with newly registered credentials
    login_resp = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["access_token"] is not None


def test_auth_logout():
    """Verify logout terminates session cleanly."""
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["authenticated"] is False
