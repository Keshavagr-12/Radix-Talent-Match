import os
import re
import json
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from pypdf import PdfReader
from docx import Document
from dotenv import load_dotenv

# Ensure environment is loaded
_backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env")

SKILL_CATEGORIES = {
    # Programming Languages (COD)
    "Python": "COD",
    "C++": "COD",
    "Java": "COD",
    "JavaScript": "COD",
    "TypeScript": "COD",
    "C": "COD",
    "Go": "COD",
    "Golang": "COD",
    "Rust": "COD",
    "C#": "COD",
    "Kotlin": "COD",
    "Swift": "COD",
    "PHP": "COD",
    # Data Structures & Algorithms (DSA)
    "Data Structures and Algorithms": "DSA",
    "DSA": "DSA",
    "Algorithms": "DSA",
    # Object Oriented Design (OOD)
    "Object-Oriented Design": "OOD",
    "OOD": "OOD",
    "OOP": "OOD",
    # Operating Systems & Systems (OS)
    "Operating Systems": "OS",
    "Linux": "OS",
    "Multithreading": "OS",
    "Unix": "OS",
    # Computer Networks (NETW)
    "Computer Networks": "NETW",
    "Networking": "NETW",
    "TCP/IP": "NETW",
    "HTTP": "NETW",
    # Databases & SQL (SQL)
    "SQL": "SQL",
    "PostgreSQL": "SQL",
    "MySQL": "SQL",
    "SQLite": "SQL",
    "MongoDB": "SQL",
    "NoSQL": "SQL",
    # Software Engineering (SWE)
    "Software Engineering": "SWE",
    "FastAPI": "SWE",
    "API": "SWE",
    "REST": "SWE",
    "GraphQL": "SWE",
    "Django": "SWE",
    "Flask": "SWE",
    "Express": "SWE",
    "Node.js": "SWE",
    "React": "SWE",
    "Next.js": "SWE",
    "Vue": "SWE",
    "Angular": "SWE",
    "Rate-limiter": "SWE",
    "Microservices": "SWE",
    "CI/CD": "SWE",
    # Cloud & DevOps (CLOUD)
    "AWS": "CLOUD",
    "Docker": "CLOUD",
    "Kubernetes": "CLOUD",
    "GCP": "CLOUD",
    "Azure": "CLOUD",
    "Terraform": "CLOUD",
    # AI & ML (AI)
    "Machine Learning": "AI",
    "Artificial Intelligence": "AI",
    "Deep Learning": "AI",
    "PyTorch": "AI",
    "TensorFlow": "AI",
    "LLM": "AI",
    "LangChain": "AI",
    # System Design (SYSD)
    "System Design": "SYSD",
    "Scalability": "SYSD",
    "Distributed Systems": "SYSD",
    # Other tools & frameworks (OTHER)
    "Git": "OTHER",
    "Redis": "OTHER",
    "Kafka": "OTHER",
    "RabbitMQ": "OTHER",
}


def read_resume_text(content: bytes, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        try:
            reader = PdfReader(BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise ValueError(f"Could not read PDF: {exc}")

    if extension == ".docx":
        try:
            document = Document(BytesIO(content))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)
        except Exception as exc:
            raise ValueError(f"Could not read DOCX: {exc}")

    raise ValueError("Only PDF and DOCX files are supported.")


def _matches_skill(text: str, skill_name: str) -> bool:
    pattern = r"(?<!\w)" + re.escape(skill_name.lower()) + r"(?!\w)"
    return bool(re.search(pattern, text.lower()))


def _convert_parsed_output_to_profile(parsed: dict, filename: str, text: str = "") -> dict:
    # Ensure education items are normalized
    education = []
    for e in parsed.get("education") or []:
        if isinstance(e, dict):
            grad_year = e.get("graduation_year")
            try:
                grad_year = int(grad_year) if grad_year else None
            except Exception:
                pass
            education.append({
                "degree": e.get("degree") or "Degree",
                "institution": e.get("institution") or "University",
                "graduation_year": grad_year,
                "field_of_study": e.get("field_of_study"),
                "score_or_gpa": e.get("score_or_gpa"),
                "id": e.get("id"),
            })

    # Ensure skills are normalized
    skills = []
    for s in parsed.get("skills") or []:
        if isinstance(s, dict):
            skills.append({
                "skill_name": s.get("skill_name") or s.get("name") or "",
                "category_code": s.get("category_code") or "OTHER",
                "evidence": s.get("evidence") or "Demonstrated in resume",
                "confidence": s.get("confidence") or "medium",
                "level": s.get("level") or 7.0,
                "proficiency_level": s.get("proficiency_level") or s.get("level") or 7.0,
            })

    # Ensure projects are normalized
    projects = []
    for p in parsed.get("projects") or []:
        if isinstance(p, dict):
            projects.append({
                "title": p.get("title") or "Project",
                "description": p.get("description") or "",
                "technologies": p.get("technologies") or [],
                "id": p.get("id"),
            })

    # Ensure internships are normalized
    internships = []
    for i in parsed.get("internships") or []:
        if isinstance(i, dict):
            desc = i.get("description") or ""
            role = i.get("role") or ""
            company = i.get("company") or ""

            best_line = None
            if text:
                for line in text.splitlines():
                    cleaned = line.strip()
                    if company and company.lower() in cleaned.lower():
                        best_line = cleaned
                        break
                    elif re.search(r"\bintern(ship)?\b", cleaned, re.I):
                        best_line = cleaned
                        break

            final_desc = best_line if best_line else (
                f"{role}: {desc}" if role and role.lower() not in desc.lower() else desc
            )
            internships.append({
                "company": company or "Company",
                "role": role or "Intern",
                "description": final_desc,
                "duration": i.get("duration"),
                "technologies": i.get("technologies") or [],
                "id": i.get("id"),
            })

    # Ensure hackathons are normalized
    hackathons = []
    for h in parsed.get("hackathons") or []:
        if isinstance(h, dict):
            year = h.get("year")
            try:
                year = int(year) if year else None
            except Exception:
                pass
            hackathons.append({
                "name": h.get("name") or "Hackathon",
                "achievement": h.get("achievement"),
                "year": year,
                "organizer": h.get("organizer"),
                "project_summary": h.get("project_summary"),
                "id": h.get("id"),
            })

    # Ensure certifications are normalized
    certifications = []
    for c in parsed.get("certifications") or []:
        if isinstance(c, dict):
            year = c.get("year")
            try:
                year = int(year) if year else None
            except Exception:
                pass
            certifications.append({
                "name": c.get("name") or "Certification",
                "issuer": c.get("issuer"),
                "year": year,
                "id": c.get("id"),
            })

    return {
        "name": parsed.get("candidate_name") or "",
        "email": parsed.get("candidate_email") or "",
        "phone": parsed.get("phone") or None,
        "headline": parsed.get("role") or None,
        "location": parsed.get("location") or None,
        "bio": parsed.get("fit_summary") or None,
        "education": education,
        "skills": skills,
        "projects": projects,
        "hackathons": hackathons,
        "internships": internships,
        "certifications": certifications,
        "preferred_roles": parsed.get("preferred_roles") or [],
        "cv_file": filename,
    }


def _extract_resume_data_rule_based(text: str, filename: str, lines: List[str]) -> dict:
    data = {}

    # Extract email
    email_match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )
    if email_match:
        data["email"] = email_match.group(0).lower()

    # Extract phone
    phone_match = re.search(
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b(?:\+91[\-\s]?)?[6789]\d{9}\b",
        text,
    )
    if phone_match:
        data["phone"] = phone_match.group(0).strip()

    # Candidate Name
    first_line = re.sub(r"^[•\-\s]+", "", lines[0]).strip()
    if (
        len(first_line) <= 100
        and not re.search(r"@|https?://|www\.", first_line, re.I)
        and not re.search(
            r"\b(resume|curriculum vitae|education|technical skills|projects)\b",
            first_line,
            re.I,
        )
    ):
        data["name"] = first_line

    # Extract skills
    skills = []
    seen_skills = set()

    for skill_name, category_code in SKILL_CATEGORIES.items():
        canonical_key = skill_name.lower()
        if canonical_key in seen_skills:
            continue

        if _matches_skill(text, skill_name):
            if skill_name == "DSA" and "data structures and algorithms" in seen_skills:
                continue
            if skill_name in ("OOD", "OOP") and "object-oriented design" in seen_skills:
                continue

            evidence = "Listed in resume"
            for line in lines:
                if _matches_skill(line, skill_name):
                    evidence = line[:200]
                    break

            skills.append({
                "skill_name": skill_name,
                "category_code": category_code,
                "evidence": evidence,
                "confidence": "medium",
                "proficiency_level": 7.0,
            })
            seen_skills.add(canonical_key)

    if skills:
        data["skills"] = skills

    # Extract education
    education = []
    degree_pattern = re.compile(
        r"\b(B\.?\s?Tech|B\.?\s?E\.?|M\.?\s?Tech|"
        r"M\.?\s?E\.?|B\.?\s?Sc|M\.?\s?Sc|"
        r"Bachelor(?:'s)?|Master(?:'s)?)\b",
        re.I,
    )

    for line in lines:
        if degree_pattern.search(line):
            year_match = re.search(r"\b(?:19|20)\d{2}\b", line)
            field = None
            if re.search(r"computer science", line, re.I):
                field = "Computer Science and Engineering"

            education.append({
                "degree": line,
                "institution": "University / College",
                "graduation_year": (
                    int(year_match.group(0)) if year_match else None
                ),
                "field_of_study": field,
            })
            break

    if education:
        data["education"] = education

    # Section header check pattern
    is_header = re.compile(
        r"^(hackathons?|competitions?|internships?|work experience|experience|"
        r"projects?|education|skills?|certifications?)(\s*[/&,]\s*"
        r"(hackathons?|competitions?|internships?|work experience|experience|"
        r"projects?|education|skills?|certifications?))*\s*:?$",
        re.I,
    )

    # Extract hackathons
    hackathons = []
    for line in lines:
        if is_header.match(line):
            continue
        if re.search(r"hackathon", line, re.I):
            year_match = re.search(r"\b(20\d{2})\b", line)
            ach_match = re.search(
                r"\b(winner|runner[- ]?up|finalist|\d+(?:st|nd|rd|th)\s+place)\b",
                line,
                re.I,
            )
            hackathons.append({
                "name": line,
                "achievement": ach_match.group(0).capitalize() if ach_match else None,
                "year": int(year_match.group(1)) if year_match else None,
            })

    if hackathons:
        data["hackathons"] = hackathons

    # Extract internships
    internships = []
    for line in lines:
        if is_header.match(line):
            continue
        if re.search(r"\bintern(ship)?\b", line, re.I):
            internships.append({
                "company": "Organization",
                "role": "Intern",
                "description": line,
                "duration": None,
            })

    if internships:
        data["internships"] = internships

    # Extract preferred roles
    preferred_roles = []
    in_roles_section = False

    for line in lines:
        colon_match = re.match(r"preferred roles?\s*:\s*(.*)$", line, re.I)
        if colon_match:
            inline_roles = colon_match.group(1).strip()
            if inline_roles:
                preferred_roles.extend(
                    role.strip(" •,-")
                    for role in re.split(r"[,|/]", inline_roles)
                    if role.strip(" •,-")
                )
            else:
                in_roles_section = True
            continue

        if re.match(r"preferred roles?\s*$", line, re.I):
            in_roles_section = True
            continue

        if in_roles_section:
            if re.match(
                r"(education|technical skills|projects|"
                r"certifications|achievements|experience|skills|hackathons)\b",
                line,
                re.I,
            ):
                break

            preferred_roles.extend(
                role.strip(" •,-")
                for role in re.split(r"[,|/]", line)
                if role.strip(" •,-")
            )

    if preferred_roles:
        data["preferred_roles"] = preferred_roles

    return {
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", None),
        "headline": data.get("headline", None),
        "location": data.get("location", None),
        "bio": data.get("bio", None),
        "education": data.get("education", []),
        "skills": data.get("skills", []),
        "projects": data.get("projects", []),
        "hackathons": data.get("hackathons", []),
        "internships": data.get("internships", []),
        "certifications": data.get("certifications", []),
        "preferred_roles": data.get("preferred_roles", []),
        "cv_file": filename,
    }


def extract_resume_data(content: bytes, filename: str) -> dict:
    """
    Extracts complete candidate profile data from an uploaded resume.
    1. First tries Resume Parser microservice (Port 8002) for complete, LLM-parsed richness.
    2. Falls back to local deterministic rule-based extractor.
    """
    text = read_resume_text(content, filename)
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if not lines:
        raise ValueError(
            "No readable text found in the resume. "
            "The PDF may be scanned or image-based."
        )

    # 1. Query live Resume Parser service (Port 8002) to get complete data
    parser_url = os.getenv("RESUME_PARSER_URL", "http://127.0.0.1:8002/resume-parsing/extract")
    try:
        content_type = (
            "application/pdf"
            if filename.lower().endswith(".pdf")
            else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        files = {"file": (filename, content, content_type)}
        resp = requests.post(parser_url, files=files, timeout=25)
        if resp.status_code == 200:
            parsed = resp.json()
            if parsed and (parsed.get("candidate_name") or parsed.get("skills")):
                return _convert_parsed_output_to_profile(parsed, filename, text=text)
    except Exception as exc:
        print(f"[Profile Builder] Note: Resume Parser microservice call failed ({exc}), using fallback")

    # 2. Rule-based extractor fallback
    return _extract_resume_data_rule_based(text, filename, lines)
