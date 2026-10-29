"""
Integration tests for RADIX JD Analytics FastAPI service (Port 8001).
Tests real persistent storage (no mock sample data), multi-format document inputs
(PDF, Word DOCX, TXT, MD), and GET access to uploaded JDs.
"""

from io import BytesIO
from docx import Document
from fastapi.testclient import TestClient

from jd_analytics.api import app
from jd_analytics.storage import clear_all_jobs


client = TestClient(app)


def setup_function():
    """Ensure clean storage before each test."""
    clear_all_jobs()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "jd_analytics"
    assert data["port"] == 8001


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "RADIX JD Analytics API"
    assert data["status"] == "online"


def test_empty_list_initially():
    """Confirms no fake sample data is returned when no JDs have been uploaded."""
    response = client.get("/jd-analytics/list")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_categories_endpoint():
    response = client.get("/jd-analytics/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 12
    codes = [c["code"] for c in data]
    assert "COD" in codes
    assert "DSA" in codes
    assert "SWE" in codes
    assert "CLOUD" in codes


def test_extract_and_access_via_get():
    """
    Uploads a JD and verifies that:
    1. Skills are extracted and classified.
    2. The JD is persisted and returned by GET /jd-analytics/list.
    3. The JD can be fetched individually by GET /jd-analytics/{jd_id}.
    """
    post_res = client.post(
        "/jd-analytics/extract",
        data={
            "raw_text": "We are seeking a Python backend engineer skilled in SQL, Docker, and Data Structures.",
            "company": "Radix Global",
            "role": "Python Backend Engineer"
        }
    )
    assert post_res.status_code == 200
    created = post_res.json()
    jd_id = created["id"]
    assert created["company"] == "Radix Global"
    assert len(created["skills"]) >= 3

    # Access via GET list command
    list_res = client.get("/jd-analytics/list")
    assert list_res.status_code == 200
    jobs = list_res.json()
    assert len(jobs) == 1
    assert jobs[0]["id"] == jd_id
    assert jobs[0]["company"] == "Radix Global"

    # Access via GET single JD command
    get_res = client.get(f"/jd-analytics/{jd_id}")
    assert get_res.status_code == 200
    single = get_res.json()
    assert single["id"] == jd_id
    assert single["role"] == "Python Backend Engineer"


def test_extract_from_word_docx_file():
    """Verifies Word (.docx) document extraction and persistence."""
    doc = Document()
    doc.add_heading("Lead Architect Job Description", 0)
    doc.add_paragraph("Seeking a Lead Architect with expertise in Java, Kubernetes, Microservices, and System Design.")
    bio = BytesIO()
    doc.save(bio)

    response = client.post(
        "/jd-analytics/extract",
        files={"file": ("Lead_Architect.docx", bio.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"company": "Stripe", "role": "Lead Architect"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company"] == "Stripe"
    assert data["source_file"] == "Lead_Architect.docx"
    assert len(data["skills"]) >= 3

    # Verify it is stored and accessible via GET
    get_res = client.get(f"/jd-analytics/{data['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["company"] == "Stripe"


def test_extract_from_markdown_file():
    """Verifies Markdown (.md) document extraction."""
    md_content = b"# DevOps Engineer\nCompany: Datadog\nSkills: AWS, Terraform, Docker, Linux, CI/CD"
    response = client.post(
        "/jd-analytics/extract",
        files={"file": ("devops.md", md_content, "text/markdown")},
        data={"company": "Datadog", "role": "DevOps Engineer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company"] == "Datadog"
    assert len(data["skills"]) >= 3


def test_extract_with_0byte_file_and_raw_text_fallback():
    """
    CRITICAL EDGE CASE: Frontend may send an empty File object alongside rawText.
    The service must not fail with 400; it must seamlessly fall back to raw_text.
    """
    response = client.post(
        "/jd-analytics/extract",
        files={"file": ("empty_selection.pdf", b"", "application/pdf")},
        data={
            "raw_text": "Senior Engineer needed with deep C++, Linux, Multithreading, and Network Sockets experience.",
            "company": "Citadel",
            "role": "Quant Systems Engineer"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company"] == "Citadel"
    assert len(data["skills"]) >= 2


def test_delete_jd_endpoint():
    """Verifies that an analyzed JD can be deleted."""
    post_res = client.post(
        "/jd-analytics/extract",
        data={"raw_text": "Looking for Go and Rust developers.", "company": "Figma", "role": "Systems Engineer"}
    )
    jd_id = post_res.json()["id"]

    # Verify exists
    assert client.get(f"/jd-analytics/{jd_id}").status_code == 200

    # Delete
    del_res = client.delete(f"/jd-analytics/{jd_id}")
    assert del_res.status_code == 200

    # Verify gone
    assert client.get(f"/jd-analytics/{jd_id}").status_code == 404
