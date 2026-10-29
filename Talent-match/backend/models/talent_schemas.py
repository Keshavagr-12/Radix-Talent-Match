"""
Pydantic data models for RADIX Talent Check API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CandidateSkill(BaseModel):
    category_code: str = Field(
        ...,
        description="RADIX 12 skill category code, e.g. COD, DSA, SQL, SYSD",
    )
    level: float = Field(
        ...,
        ge=0,
        le=10,
        description="Candidate assessed skill level from 0 to 10",
    )


class CandidateProfile(BaseModel):
    candidate_id: Optional[str] = "candidate-001"
    name: Optional[str] = "Candidate"
    skills: List[CandidateSkill] = []


class SkillGap(BaseModel):
    category_code: str
    required_level: float
    candidate_level: float
    gap: bool
    gap_amount: float
    category_name: Optional[str] = None
    meets_bar: Optional[bool] = None


class TalentCheckRequest(BaseModel):
    company: str
    candidate: Optional[CandidateProfile] = None
    profile: Optional[Dict[str, Any]] = None
    candidate_skills: Optional[Dict[str, float]] = None


class CompanyExpectation(BaseModel):
    company_name: str
    short_name: Optional[str] = None
    tier_descriptor: Optional[str] = "Enterprise Benchmark Tier"
    headquarters: Optional[str] = "India Operations"
    readiness_threshold: Optional[float] = 80.0
    evaluation_summary: Optional[str] = None
    expected_skills: Dict[str, float]
    source: Optional[str] = "local_snapshot"


class TalentCheckResponse(BaseModel):
    company: str
    readiness_score: float = Field(..., ge=0, le=100)
    skillset_gap: List[SkillGap]
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    readiness_status: Optional[str] = "READY"
    readiness_label: Optional[str] = "Ready for Target Role"
    threshold: Optional[float] = 80.0
    met_categories_count: Optional[int] = 12
    gap_categories_count: Optional[int] = 0
    summary: Optional[str] = None
    source: Optional[str] = "local_snapshot"
    evaluated_at: Optional[str] = None
