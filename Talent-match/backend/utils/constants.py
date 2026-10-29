"""
Constants for RADIX Talent Check (Role 4)
Defines the 12 canonical RADIX skill categories, readiness thresholds,
and status classifications.
"""

from typing import Dict, List

# The 12 Canonical RADIX Skillset Categories
RADIX_SKILLSET_CODES: List[str] = [
    "COD",   # Core Coding & Language Syntax
    "DSA",   # Data Structures & Algorithms
    "SYSD",  # System Design & Distributed Architecture
    "SWE",   # Software Engineering & Dev Lifecycle
    "CLOUD", # Cloud Platforms & DevOps
    "SQL",   # Relational Databases & SQL
    "AI",    # Artificial Intelligence & ML
    "OS",    # Operating Systems & Concurrency
    "NETW",  # Computer Networks & Protocols
    "OOD",   # Object-Oriented Design & Patterns
    "APTI",  # Quantitative Aptitude & Problem Solving
    "COMM",  # Technical Communication & Collaboration
]

RADIX_CATEGORY_METADATA: Dict[str, Dict[str, str]] = {
    "COD": {
        "name": "Core Coding Fluency",
        "shortName": "Coding",
        "description": "Clean, idiomatic code syntax and algorithmic implementation."
    },
    "DSA": {
        "name": "Data Structures & Algorithms",
        "shortName": "DSA",
        "description": "Time/space complexity, core trees/graphs/dynamic programming."
    },
    "SYSD": {
        "name": "System Design & Architecture",
        "shortName": "System Design",
        "description": "High-availability, load balancing, caching, and scalable architecture."
    },
    "SWE": {
        "name": "Software Engineering Best Practices",
        "shortName": "SWE Practices",
        "description": "Version control, testing frameworks, CI/CD, and refactoring."
    },
    "CLOUD": {
        "name": "Cloud Platforms & Infrastructure",
        "shortName": "Cloud",
        "description": "AWS, GCP, Azure, containers (Docker, K8s), serverless workflows."
    },
    "SQL": {
        "name": "Relational Databases & SQL",
        "shortName": "SQL/DB",
        "description": "Schema modeling, query optimization, indexing, and transactions."
    },
    "AI": {
        "name": "AI & Machine Learning Concepts",
        "shortName": "AI/ML",
        "description": "Applied ML pipelines, LLMs, prompt engineering, vector search."
    },
    "OS": {
        "name": "Operating Systems & Concurrency",
        "shortName": "OS/Concurrency",
        "description": "Threads, memory management, process scheduling, IPC."
    },
    "NETW": {
        "name": "Computer Networks & Protocols",
        "shortName": "Networking",
        "description": "TCP/IP, HTTP/REST, gRPC, WebSockets, DNS, routing."
    },
    "OOD": {
        "name": "Object-Oriented Design & Principles",
        "shortName": "OOD/Patterns",
        "description": "SOLID principles, design patterns, modular domain modeling."
    },
    "APTI": {
        "name": "Analytical Problem Solving",
        "shortName": "Aptitude",
        "description": "Logical deduction, numerical reasoning, structured breakdown."
    },
    "COMM": {
        "name": "Technical Communication & Articulation",
        "shortName": "Communication",
        "description": "Design reviews, code documentation, technical presentation."
    },
}

# Readiness Thresholds (Design Decision)
# >= 80%: Ready for live recruitment/interview pipeline
# 65% - 79.9%: Upskilling Recommended (2-4 gap areas need polishing)
# < 65%: Needs Focused Preparation (fundamental gap remediation required)
READINESS_THRESHOLD_READY: float = 80.0
READINESS_THRESHOLD_UPSKILLING: float = 65.0

STATUS_READY = "READY"
STATUS_UPSKILLING = "UPSKILLING_RECOMMENDED"
STATUS_NEEDS_PREP = "NEEDS_PREPARATION"

STATUS_LABELS: Dict[str, str] = {
    STATUS_READY: "Ready for Target Role",
    STATUS_UPSKILLING: "Upskilling Recommended",
    STATUS_NEEDS_PREP: "Needs Focused Preparation"
}
