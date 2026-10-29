"""
Pydantic Schemas for RADIX Skill Matching Service (Role 5 - Port 8005)
Defines strict models for comparing Candidate Profiles against Job Descriptions.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"
]

ConfidenceLevel = Literal["high", "medium", "low"]


class SkillItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skill_name: str
    category_code: str = "OTHER"
    evidence: Optional[str] = "Validated candidate skill"
    confidence: Optional[str] = "high"
    proficiency_level: Optional[float] = None
    level: Optional[float] = None
    match_type: Optional[str] = None
    match_explanation: Optional[str] = None
    gap_explanation: Optional[str] = None
    recommendation: Optional[str] = None


class PartialMatchItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    jd_skill: Dict[str, Any]
    candidate_skill: Dict[str, Any]
    similarity_note: str
    gap_explanation: Optional[str] = None


class GapAnalysisSummary(BaseModel):
    total_jd_skills: int = 0
    matched_count: int = 0
    missing_count: int = 0
    partial_count: int = 0
    critical_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    moderate_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    top_recommendations: List[str] = Field(default_factory=list)


class SkillMatchingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    profile: Optional[Dict[str, Any]] = None
    jd: Optional[Dict[str, Any]] = None
    candidate_id: Optional[str] = None
    jd_id: Optional[str] = None


class SkillMatchingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: Optional[str] = None
    candidate_name: str
    company: str
    role: str
    jd_source_file: str
    match_score: int = Field(..., ge=0, le=100)
    matched_skills: List[Dict[str, Any]] = Field(default_factory=list)
    missing_skills: List[Dict[str, Any]] = Field(default_factory=list)
    partial_skills: List[PartialMatchItem] = Field(default_factory=list)
    gap_analysis: Optional[GapAnalysisSummary] = None
    evaluated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CandidateOption(BaseModel):
    id: str
    name: str
    skills_count: int
    headline: Optional[str] = None


class JDOption(BaseModel):
    id: str
    company: str
    role: str
    source_file: str
    skills_count: int
