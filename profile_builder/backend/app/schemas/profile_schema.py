from typing import Literal, Union, List, Optional, Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


CategoryCode = Literal[
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"
]

Confidence = Literal["high", "medium", "low"]


class EducationItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    degree: str = "Degree"
    institution: str = "Institution"
    graduation_year: Optional[Union[int, str]] = None
    field_of_study: Optional[str] = None
    score_or_gpa: Optional[str] = None
    id: Optional[str] = None


class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    skill_name: str = Field(min_length=1, max_length=100)
    category_code: CategoryCode = "OTHER"
    evidence: str = ""
    confidence: Confidence = "medium"
    level: Optional[float] = Field(default=7.0, ge=0, le=10)
    proficiency_level: Optional[float] = Field(default=7.0, ge=0, le=10)


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = "Project"
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    id: Optional[str] = None


class Hackathon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    achievement: Optional[str] = None
    year: Optional[Union[int, str]] = None
    organizer: Optional[str] = None
    project_summary: Optional[str] = None
    id: Optional[str] = None


class Internship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    company: str
    role: str
    description: str = ""
    duration: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    id: Optional[str] = None


class Certification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    issuer: Optional[str] = None
    year: Optional[Union[int, str]] = None
    id: Optional[str] = None


class ProfileCreate(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    education: Any = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    hackathons: List[Hackathon] = Field(default_factory=list)
    internships: List[Internship] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    cv_file: Optional[str] = None

    @field_validator("education", mode="before")
    @classmethod
    def normalize_education(cls, v):
        if isinstance(v, str):
            return [{"degree": v, "institution": v, "graduation_year": 2025}]
        elif isinstance(v, list):
            return v
        return []


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[Any] = None
    skills: Optional[List[Skill]] = None
    projects: Optional[List[Project]] = None
    hackathons: Optional[List[Hackathon]] = None
    internships: Optional[List[Internship]] = None
    certifications: Optional[List[Certification]] = None
    preferred_roles: Optional[List[str]] = None
    cv_file: Optional[str] = None


class ProfileResponse(ProfileCreate):
    id: str
