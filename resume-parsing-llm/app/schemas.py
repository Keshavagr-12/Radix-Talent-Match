"""
Pydantic Schemas for RADIX Resume Parsing Microservice.
Defines data models for skills, education, projects, internships, hackathons, and certifications.
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
    """Individual extracted skill mapped to a RADIX competency category."""
    model_config = ConfigDict(extra="ignore")

    skill_name: str = Field(..., min_length=1, description="Extracted skill or technology name")
    category_code: CategoryCode = Field(..., description="RADIX Category code")
    evidence: str = Field(..., min_length=1, description="Context sentence or bullet point from resume")
    confidence: ConfidenceLevel = Field(default="high", description="Extraction confidence: high, medium, low")
    proficiency_level: Optional[int] = Field(default=8, ge=1, le=10, description="Proficiency level on 1-10 scale")


class Education(BaseModel):
    """Candidate educational credential."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique education identifier")
    institution: str = Field(..., description="College, university or school name")
    degree: str = Field(..., description="Degree obtained e.g. B.Tech, M.S., BCA")
    field_of_study: str = Field(..., description="Major or specialization e.g. Computer Science")
    graduation_year: str = Field(..., description="Graduation year or date range")
    score_or_gpa: str = Field(default="", description="GPA, CGPA or percentage score")


class ProjectItem(BaseModel):
    """Candidate technical project."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique project identifier")
    title: str = Field(..., description="Title of the project")
    description: str = Field(..., description="Summary of architecture, impact, and functionality")
    technologies: List[str] = Field(default_factory=list, description="Technologies and frameworks used")
    link: Optional[str] = Field(default=None, description="Repository or live deployment link")


class Internship(BaseModel):
    """Candidate work or internship experience."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique internship identifier")
    company: str = Field(..., description="Employing organization name")
    role: str = Field(..., description="Role title e.g. Backend Intern")
    duration: str = Field(..., description="Duration or dates e.g. May 2024 - Jul 2024")
    description: str = Field(..., description="Responsibilities, achievements and technical duties")
    technologies: List[str] = Field(default_factory=list, description="Technologies used on the job")


class Hackathon(BaseModel):
    """Candidate hackathon or competitive programming achievement."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique hackathon identifier")
    name: str = Field(..., description="Competition or hackathon name")
    organizer: str = Field(..., description="Organizer or hosting entity")
    year: str = Field(..., description="Year of participation")
    achievement: str = Field(..., description="Placement e.g. Winner, Finalist, Participant")
    project_summary: str = Field(..., description="Summary of project built")


class Certification(BaseModel):
    """Candidate professional certification."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique certification identifier")
    name: str = Field(..., description="Certification title")
    issuer: str = Field(..., description="Issuing organization e.g. AWS, Google Cloud, Oracle")
    year: str = Field(..., description="Year earned")
    credential_id: Optional[str] = Field(default=None, description="Credential ID or verification URL")


class ParsedResumeOutput(BaseModel):
    """
    Canonical RADIX ParsedResumeOutput contract matching frontend types.
    Extends ExtractedSkillList with structured candidate sections.
    """
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique persistent candidate identifier")
    source_type: Literal["resume"] = Field(default="resume", description="Document source type")
    source_file: str = Field(..., description="Original filename of the resume document")
    company: str = Field(default="Candidate Profile", description="Headline company or target profile")
    role: str = Field(default="Software Engineer", description="Target or headline engineering role")
    candidate_name: str = Field(..., description="Candidate full name")
    candidate_email: str = Field(..., description="Candidate contact email")
    phone: Optional[str] = Field(default="", description="Contact phone number")
    location: Optional[str] = Field(default="Flexible / Remote", description="Candidate location")
    profile_archetype: Optional[str] = Field(default="Software Engineer", description="RADIX archetype")
    fit_summary: Optional[str] = Field(default="", description="Evaluation summary of skills and experience")
    skills: List[Skill] = Field(default_factory=list, description="Extracted technical competencies")
    education: List[Education] = Field(default_factory=list, description="Education history")
    projects: List[ProjectItem] = Field(default_factory=list, description="Technical projects")
    internships: List[Internship] = Field(default_factory=list, description="Internships and work experience")
    hackathons: List[Hackathon] = Field(default_factory=list, description="Hackathons and competitions")
    certifications: List[Certification] = Field(default_factory=list, description="Certifications earned")
    preferred_roles: List[str] = Field(default_factory=list, description="Preferred job roles")
    required_technologies: List[str] = Field(default_factory=list, description="Key technologies detected")
    summary: Optional[str] = Field(default="", description="Resume overview summary")
    analyzed_at: str = Field(..., description="ISO 8601 UTC timestamp of analysis")


# -------------------------------------------------------------
# STRICT PYDANTIC MODELS FOR GROQ LLM STRUCTURED OUTPUT
# (All properties must be required and extra="forbid" for strict JSON Schema)
# -------------------------------------------------------------

class LLMSkill(BaseModel):
    model_config = ConfigDict(extra="forbid")
    skill_name: str
    category_code: CategoryCode
    evidence: str
    confidence: ConfidenceLevel
    proficiency_level: int


class LLMEducation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    institution: str
    degree: str
    field_of_study: str
    graduation_year: str
    score_or_gpa: str


class LLMProjectItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    description: str
    technologies: List[str]
    link: str


class LLMInternship(BaseModel):
    model_config = ConfigDict(extra="forbid")
    company: str
    role: str
    duration: str
    description: str
    technologies: List[str]


class LLMHackathon(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    organizer: str
    year: str
    achievement: str
    project_summary: str


class LLMCertification(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    issuer: str
    year: str
    credential_id: str


class LLMResumeExtraction(BaseModel):
    """Strict schema passed to Groq structured json_schema API."""
    model_config = ConfigDict(extra="forbid")

    candidate_name: str
    candidate_email: str
    phone: str
    location: str
    profile_archetype: str
    fit_summary: str
    headline_role: str
    preferred_roles: List[str]
    required_technologies: List[str]
    skills: List[LLMSkill]
    education: List[LLMEducation]
    projects: List[LLMProjectItem]
    internships: List[LLMInternship]
    hackathons: List[LLMHackathon]
    certifications: List[LLMCertification]


class ResumeTextRequest(BaseModel):
    """Request payload for raw text resume parsing."""
    raw_text: str = Field(..., min_length=1, description="Raw text of candidate resume")
    filename: Optional[str] = Field(default="resume.txt", description="Document filename")
    candidate_name: Optional[str] = Field(default=None, description="Optional override candidate name")
    candidate_email: Optional[str] = Field(default=None, description="Optional override candidate email")
