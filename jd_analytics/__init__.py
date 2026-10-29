"""
RADIX JD Analytics Package.
FastAPI microservice for job description text extraction, Groq LLM skill analysis,
and RADIX competency classification.
"""

from .schemas import JobAnalysis, Skill, CategoryCode, ConfidenceLevel, ExtractedSkillListResponse
from .extractor import extract_text
from .analyzer import analyze_job_description, fallback_skill_extractor
from .storage import get_all_jobs, get_job_by_id, save_job, delete_job

__all__ = [
    "JobAnalysis",
    "Skill",
    "CategoryCode",
    "ConfidenceLevel",
    "ExtractedSkillListResponse",
    "extract_text",
    "analyze_job_description",
    "fallback_skill_extractor",
    "get_all_jobs",
    "get_job_by_id",
    "save_job",
    "delete_job",
]
