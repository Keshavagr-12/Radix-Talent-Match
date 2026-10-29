from io import BytesIO
import pytest
from docx import Document

from app.services.resume_parser import extract_resume_data, read_resume_text, _matches_skill


def create_docx(paragraphs: list[str]) -> bytes:
    doc = Document()
    for text in paragraphs:
        doc.add_paragraph(text)
    bio = BytesIO()
    doc.save(bio)
    return bio.getvalue()


def test_skill_word_boundary_matching():
    # True positives
    assert _matches_skill("I use AWS for cloud hosting", "AWS")
    assert _matches_skill("Experienced in Git version control", "Git")
    assert _matches_skill("Strong DSA fundamentals", "DSA")
    assert _matches_skill("Building REST API services", "API")
    assert _matches_skill("Proficient in C++ and Python", "C++")
    assert _matches_skill("Worked with Node.js and React", "Node.js")

    # True negatives (substrings within other words)
    assert not _matches_skill("Fixing flaws in awesome software", "AWS")
    assert not _matches_skill("Digital signals and circuits", "Git")
    assert not _matches_skill("Capital investment portfolio", "API")
    assert not _matches_skill("Beautiful landscape photography", "DSA")


def test_docx_resume_extraction():
    paragraphs = [
        "Rohit Sharma",
        "rohit.sharma@example.com",
        "B.Tech in Computer Science and Engineering, 2026",
        "Skills: Python, C++, Docker, AWS, SQL",
        "Hackathons / Internships",
        "Finalist at Smart India Hackathon 2024",
        "Summer intern at TechCorp building cloud APIs",
        "Preferred Roles: Backend Engineer, Cloud Engineer",
    ]
    content = create_docx(paragraphs)
    data = extract_resume_data(content, "rohit_resume.docx")

    assert data["name"] == "Rohit Sharma"
    assert data["email"] == "rohit.sharma@example.com"
    assert len(data["education"]) == 1
    assert data["education"][0]["graduation_year"] == 2026
    assert data["education"][0]["field_of_study"] == "Computer Science and Engineering"

    # Verify skills
    skill_names = {s["skill_name"] for s in data["skills"]}
    assert "Python" in skill_names
    assert "C++" in skill_names
    assert "Docker" in skill_names
    assert "AWS" in skill_names
    assert "SQL" in skill_names

    # Verify hackathon
    assert len(data["hackathons"]) == 1
    assert "Smart India Hackathon" in data["hackathons"][0]["name"]
    assert data["hackathons"][0]["year"] == 2024
    assert data["hackathons"][0]["achievement"] == "Finalist"

    # Verify internship
    assert len(data["internships"]) == 1
    assert "Summer intern" in data["internships"][0]["description"]

    # Verify preferred roles
    assert "Backend Engineer" in data["preferred_roles"]
    assert "Cloud Engineer" in data["preferred_roles"]


def test_unsupported_file_extension():
    with pytest.raises(ValueError, match="Only PDF and DOCX files are supported"):
        read_resume_text(b"some text", "resume.txt")


def test_empty_resume_content():
    content = create_docx([])
    with pytest.raises(ValueError, match="No readable text found"):
        extract_resume_data(content, "empty.docx")
