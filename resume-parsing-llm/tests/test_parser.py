"""
Unit tests for resume parsing and RADIX skill taxonomy classification.
"""

from app.parser import parse_resume_rule_based


def test_rule_based_contact_and_skills_extraction():
    resume_text = """
    Rohan Verma
    rohan.verma@example.com | +91 98765 43210 | Bengaluru, India
    
    Education:
    B.Tech in Computer Science & Engineering from BITS Pilani, 2024, 8.9 CGPA.
    
    Technical Skills:
    - Languages: Python, Go, C++, JavaScript
    - Algorithms: Advanced Data Structures, Trees, Graphs, Dynamic Programming
    - Cloud & Systems: AWS, Docker, Kubernetes, Linux, System Design, Microservices
    - Databases: PostgreSQL, SQL, Redis
    - Software Engineering: Git, CI/CD, Unit Testing with PyTest
    
    Projects:
    - Distributed Cache: Built an in-memory key-value cache using Go and Redis.
    - Cloud Pipeline: Automated deployment using Docker and Kubernetes on AWS.
    
    Experience:
    - Software Engineering Intern at CloudTech: Optimized database queries and REST APIs.
    """

    parsed = parse_resume_rule_based(resume_text, "rohan_verma_resume.pdf")

    assert parsed.candidate_name == "Rohan Verma"
    assert parsed.candidate_email == "rohan.verma@example.com"
    assert "98765" in parsed.phone
    assert parsed.location in ("Bengaluru", "Flexible / Hybrid")
    assert len(parsed.skills) >= 5

    categories = {s.category_code for s in parsed.skills}
    # Check that core RADIX categories were identified
    assert "COD" in categories
    assert "DSA" in categories
    assert "CLOUD" in categories or "SYSD" in categories
    assert "SQL" in categories

    assert len(parsed.education) >= 1
    assert "BITS Pilani" in parsed.education[0].institution or "Computer Science" in parsed.education[0].field_of_study

    assert len(parsed.projects) >= 1
    assert len(parsed.internships) >= 1
