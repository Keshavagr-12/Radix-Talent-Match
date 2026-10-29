"""
RADIX JD Analytics Pydantic Schemas
Defines structured data models and validation for job description skill analysis.
"""

from typing import Literal, Optional, List
from pydantic import BaseModel, ConfigDict, Field


CategoryCode = Literal[
    "COD",
    "DSA",
    "OOD",
    "APTI",
    "COMM",
    "AI",
    "CLOUD",
    "SQL",
    "SWE",
    "SYSD",
    "NETW",
    "OS",
    "OTHER",
]

ConfidenceLevel = Literal["high", "medium", "low"]


class Skill(BaseModel):
    """Individual extracted skill tagged with a RADIX competency code."""
    model_config = ConfigDict(extra="forbid")

    skill_name: str = Field(..., min_length=1, description="Name of the extracted skill or technology")
    category_code: CategoryCode = Field(..., description="RADIX Category abbreviation code")
    evidence: str = Field(..., min_length=1, description="Direct supporting phrase or context from the JD")
    confidence: ConfidenceLevel = Field(..., description="Extraction confidence: high, medium, or low")


class JobAnalysis(BaseModel):
    """Container for parsed job description skills (matches strict Groq json_schema)."""
    model_config = ConfigDict(extra="forbid")

    skills: List[Skill] = Field(default_factory=list, description="List of extracted RADIX skills")


class TextAnalysisRequest(BaseModel):
    """JSON payload for job description text extraction."""
    raw_text: str = Field(..., min_length=1, description="Raw text of the job description")
    company: Optional[str] = Field(default=None, description="Optional company name override")
    role: Optional[str] = Field(default=None, description="Optional job role override")
    location: Optional[str] = Field(default=None, description="Optional job location")
    source_file: Optional[str] = Field(default="raw_text_input", description="Identifier of the source document")
    sample_id: Optional[str] = Field(default=None, description="Optional sample JD identifier")


class ExtractedSkillListResponse(BaseModel):
    """Canonical RADIX ExtractedSkillList output contract matching master frontend."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique persistent identifier for this analyzed JD")
    source_type: Literal["jd", "resume"] = Field(default="jd", description="Document source type")
    source_file: str = Field(..., description="File name or label of the JD")
    company: str = Field(..., description="Hiring company")
    role: str = Field(..., description="Target role title")
    location: Optional[str] = Field(default="Not specified", description="Office or remote location")
    skills: List[Skill] = Field(default_factory=list, description="Extracted competency skills")
    required_technologies: List[str] = Field(default_factory=list, description="Extracted core technologies list")
    summary: Optional[str] = Field(default=None, description="Summary description")
    analyzed_at: str = Field(..., description="ISO 8601 UTC timestamp of analysis")
