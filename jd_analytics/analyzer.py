"""
RADIX Job Description Skill Analyzer.
Uses Groq LLM with structured output, supplemented with an intelligent rule-based fallback.
"""

import os
import re
import json
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from groq import Groq

# Resilient environment variable loading
_this_dir = Path(__file__).resolve().parent
load_dotenv(_this_dir / ".env")
load_dotenv(_this_dir.parent / ".env")
load_dotenv()

# Resilient imports (supports both relative package import and standalone script execution)
try:
    from .schemas import JobAnalysis, Skill
    from .prompts import SYSTEM_PROMPT
except (ImportError, ValueError):
    from schemas import JobAnalysis, Skill
    from prompts import SYSTEM_PROMPT


def _build_strict_schema() -> dict:
    schema = JobAnalysis.model_json_schema()
    schema["required"] = ["skills"]
    schema["additionalProperties"] = False
    if "$defs" in schema and "Skill" in schema["$defs"]:
        schema["$defs"]["Skill"]["additionalProperties"] = False
        schema["$defs"]["Skill"]["required"] = ["skill_name", "category_code", "evidence", "confidence"]
    return schema


def analyze_job_description(jd_text: str) -> JobAnalysis:
    """
    Analyzes job description text using Groq LLM with fallback to rule-based classification.
    Returns a validated JobAnalysis instance with extracted RADIX skills.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not api_key.strip():
        print("[JD Analyzer] GROQ_API_KEY not configured. Using rule-based extractor.")
        return analyze_job_description_rule_based(jd_text)

    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    try:
        client = Groq(api_key=api_key.strip(), timeout=25.0)

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": (
                        "Extract and classify all skills and technologies in this job description "
                        "into official RADIX categories:\n\n" + jd_text
                    )
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "radix_jd_analysis",
                    "strict": True,
                    "schema": _build_strict_schema()
                }
            },
            temperature=0.1
        )

        content = response.choices[0].message.content
        if not content or not content.strip():
            raise ValueError("The LLM returned an empty response.")

        # Clean JSON markdown fences if present
        clean_json_str = _clean_llm_json(content)
        data = json.loads(clean_json_str)

        result = JobAnalysis.model_validate(data)

        # If LLM returned 0 skills, supplement with rule-based extractor
        if not result.skills:
            rule_skills = fallback_skill_extractor(jd_text)
            result.skills = [Skill.model_validate(s) for s in rule_skills]

        return result

    except Exception as exc:
        print(f"[JD Analyzer] Groq LLM call failed ({exc}). Using rule-based fallback extractor.")
        return analyze_job_description_rule_based(jd_text)


def analyze_job_description_rule_based(text: str) -> JobAnalysis:
    """
    High-accuracy deterministic fallback extractor for RADIX skills.
    Extracts core competencies across all 12 RADIX categories from text.
    """
    skills_data = fallback_skill_extractor(text)
    skills = [Skill.model_validate(s) for s in skills_data]
    return JobAnalysis(skills=skills)


def fallback_skill_extractor(text: str) -> List[dict]:
    """
    Rule-based skill dictionary covering all 12 RADIX categories with evidence generation.
    """
    mapping = [
        # COD (Coding)
        ("Python", "COD", "General-purpose programming and backend scripting"),
        ("Java", "COD", "Core enterprise language and object-oriented programming"),
        ("C++", "COD", "High-performance systems programming and algorithm implementation"),
        ("C#", "COD", "Modern object-oriented software development on .NET"),
        ("TypeScript", "COD", "Type-safe modern web and server-side development"),
        ("JavaScript", "COD", "Front-end and full-stack event-driven programming"),
        ("Go", "COD", "Concurrent systems and microservices programming"),
        ("Rust", "COD", "Memory-safe systems programming"),

        # DSA (Data Structures & Algorithms)
        ("Data Structures", "DSA", "Fundamental computer science data organization"),
        ("Algorithms", "DSA", "Problem-solving procedures and complexity optimization"),
        ("Dynamic Programming", "DSA", "Advanced algorithmic optimization technique"),
        ("Graph Algorithms", "DSA", "Graph traversal, shortest path, and connectivity"),
        ("Trees", "DSA", "Binary search trees, heaps, and hierarchical data models"),

        # OOD (Object-Oriented Design)
        ("Object-Oriented Design", "OOD", "Software architecture based on classes, objects, and relationships"),
        ("Design Patterns", "OOD", "Standard solutions to recurring architectural software challenges"),
        ("SOLID Principles", "OOD", "Principles of maintainable object-oriented software engineering"),

        # APTI (Aptitude & Analytical Thinking)
        ("Problem Solving", "APTI", "Analytical reasoning and algorithmic troubleshooting"),
        ("Quantitative Aptitude", "APTI", "Mathematical reasoning, statistics, and numeric analysis"),
        ("Critical Thinking", "APTI", "Evaluative decision making and logic synthesis"),

        # COMM (Communication & Collaboration)
        ("Technical Writing", "COMM", "Documenting technical specifications, API guides, and architecture"),
        ("Communication", "COMM", "Articulating complex technical concepts across multidisciplinary teams"),
        ("Cross-functional Collaboration", "COMM", "Partnering with product, design, and engineering teams"),

        # AI (Artificial Intelligence & Machine Learning)
        ("Machine Learning", "AI", "Designing and training predictive statistical models"),
        ("Deep Learning", "AI", "Neural network architectures and representation learning"),
        ("Natural Language Processing", "AI", "Text processing, semantic analysis, and language models"),
        ("PyTorch", "AI", "Deep learning framework for training and deploying AI models"),
        ("TensorFlow", "AI", "Open-source machine learning and deep learning ecosystem"),
        ("Large Language Models", "AI", "Fine-tuning, prompt engineering, and LLM orchestration"),

        # CLOUD (Cloud & DevOps)
        ("AWS", "CLOUD", "Amazon Web Services cloud architecture and services"),
        ("Azure", "CLOUD", "Microsoft Azure enterprise cloud services"),
        ("Google Cloud Platform", "CLOUD", "GCP cloud services, BigQuery, and Vertex AI"),
        ("Docker", "CLOUD", "Containerization of microservices and dependencies"),
        ("Kubernetes", "CLOUD", "Container orchestration, scaling, and cluster management"),
        ("CI/CD", "CLOUD", "Continuous integration and automated deployment pipelines"),

        # SQL (Relational Databases & Queries)
        ("SQL", "SQL", "Structured query language for relational database management"),
        ("PostgreSQL", "SQL", "Advanced open-source relational database management system"),
        ("MySQL", "SQL", "High-throughput open-source relational database"),
        ("Database Indexing", "SQL", "Query execution plan optimization and performance tuning"),

        # SWE (Software Engineering Best Practices)
        ("Software Engineering", "SWE", "Full-lifecycle software engineering and design methodologies"),
        ("Unit Testing", "SWE", "Automated unit test development, coverage, and mocking"),
        ("Git", "SWE", "Distributed version control and branch management workflows"),
        ("FastAPI", "SWE", "High-performance Python asynchronous RESTful API development"),
        ("RESTful APIs", "SWE", "HTTP REST API design, serialization, and status codes"),
        ("Agile", "SWE", "Scrum sprints, iterative development, and backlog grooming"),

        # SYSD (System Design & Distributed Systems)
        ("System Design", "SYSD", "High-level architecture for large-scale systems"),
        ("Distributed Systems", "SYSD", "Fault-tolerant, consensus-driven networked architectures"),
        ("Scalability", "SYSD", "Horizontal scaling, load distribution, and throughput optimization"),
        ("Microservices", "SYSD", "Decoupled domain service architecture with message boundaries"),
        ("Caching", "SYSD", "Redis and Memcached in-memory acceleration layers"),

        # NETW (Networking Protocols & Security)
        ("Networking", "NETW", "Computer networking protocols and infrastructure"),
        ("TCP/IP", "NETW", "Core Internet protocol stack and socket communication"),
        ("HTTP/HTTPS", "NETW", "Web protocols, TLS encryption, and secure client-server transport"),
        ("gRPC", "NETW", "High-performance RPC protocol using Protocol Buffers"),

        # OS (Operating Systems & Concurrency)
        ("Linux", "OS", "Linux server administration, kernel basics, and shell scripting"),
        ("Operating Systems", "OS", "Process scheduling, virtual memory, and kernel abstractions"),
        ("Concurrency", "OS", "Multithreading, asynchronous execution, and race condition prevention"),
        ("Multithreading", "OS", "Thread pooling, mutex locks, and concurrent CPU execution")
    ]

    extracted = []
    seen_skills = set()
    t_lower = text.lower()

    for name, cat, default_ev in mapping:
        pattern = r"\b" + re.escape(name.lower()) + r"\b"
        if re.search(pattern, t_lower) and name not in seen_skills:
            seen_skills.add(name)

            # Find matching sentence for evidence
            evidence = default_ev
            sentences = re.split(r"[.\n;]", text)
            for s in sentences:
                if name.lower() in s.lower() and len(s.strip()) > 10:
                    evidence = s.strip()[:140]
                    break

            extracted.append({
                "skill_name": name,
                "category_code": cat,
                "evidence": evidence,
                "confidence": "high"
            })

    return extracted


def _clean_llm_json(raw: str) -> str:
    """Strips markdown code fences and extracts the outermost JSON block."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.I)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    # Search for outermost JSON object { ... }
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
        return match.group(0)
    return cleaned
