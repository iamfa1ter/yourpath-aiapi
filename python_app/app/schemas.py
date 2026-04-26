from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Impact(str, Enum):
    High = "High"
    Medium = "Medium"
    Low = "Low"


class ProgramCategory(str, Enum):
    Dream = "Dream"
    Match = "Match"
    Safe = "Safe"


class DegreeLevel(str, Enum):
    Master = "Master"
    PhD = "PhD"


class ChatMode(str, Enum):
    casual = "casual"
    definition = "definition"
    strategy = "strategy"
    redirect = "redirect"


class RoadmapStep(BaseModel):
    phase: str
    title: str
    tasks: list[str]


class GapItem(BaseModel):
    gap: str
    impact: Impact
    action: str


class Scholarship(BaseModel):
    name: str
    type: str
    fitPercentage: float
    rationale: str


class UndergraduateUniversity(BaseModel):
    name: str
    country: str
    category: ProgramCategory
    admissionChancePercentage: float
    rationale: str
    scholarshipNotes: str


class GraduateProgram(BaseModel):
    university: str
    country: str
    programName: str
    degreeLevel: DegreeLevel
    category: ProgramCategory
    admissionChancePercentage: float
    researchFit: str
    scholarshipNotes: str


class MajorRecommendation(BaseModel):
    name: str
    fitScore: float
    rationale: str


class UndergraduateCategories(BaseModel):
    dream: list[UndergraduateUniversity]
    match: list[UndergraduateUniversity]
    safe: list[UndergraduateUniversity]


class GraduateCategories(BaseModel):
    dream: list[GraduateProgram]
    match: list[GraduateProgram]
    safe: list[GraduateProgram]


class StudentAnalysis(BaseModel):
    profileSummary: str
    evaluationScore: float
    admissionChancePercentage: float
    recommendedMajors: list[MajorRecommendation]
    recommendedUniversities: list[UndergraduateUniversity]
    universityCategories: UndergraduateCategories
    scholarshipRecommendations: list[Scholarship]
    strengths: list[str]
    weaknesses: list[str]
    gapAnalysis: list[GapItem]
    roadmap: list[RoadmapStep]
    personalStatementDraft: str
    recommendedNextSteps: list[str]


class GraduateAnalysis(BaseModel):
    profileSummary: str
    evaluationScore: float
    admissionChancePercentage: float
    programRecommendations: list[GraduateProgram]
    programCategories: GraduateCategories
    scholarshipRecommendations: list[Scholarship]
    researchFitSummary: str
    supervisorLabSearchStrategy: list[str]
    strengths: list[str]
    weaknesses: list[str]
    gapAnalysis: list[GapItem]
    roadmap: list[RoadmapStep]
    statementOfPurposeDraft: str
    researchStatementDraft: str
    recommendedNextSteps: list[str]


class AdmissionAdvisorAnalysis(BaseModel):
    admissionStrength: str
    suitableProgramDirections: list[str]
    recommendedTargetFields: list[str]
    targetCountriesAndUniversityTiers: list[str]
    masterVsPhdRecommendation: str
    weaknesses: list[str]
    improvementPlan: list[RoadmapStep]
    thesisPositioning: str
    recommendationLetterStrategy: list[str]
    missingInformationImpact: list[str]
    nextSteps: list[str]


class ChatAdvisorSection(BaseModel):
    title: str
    content: str
    items: list[str]


class ChatAdvisorReply(BaseModel):
    mode: ChatMode
    content: str
    sections: list[ChatAdvisorSection]
    followUpQuestions: list[str]


class ProviderPayload(BaseModel):
    provider: str
    model: str


class AnalysisResponse(BaseModel):
    analysis: Any
    provider: str
    model: str


class ChatResponse(BaseModel):
    reply: ChatAdvisorReply
    provider: str
    model: str


class ErrorResponse(BaseModel):
    error: str
    details: dict[str, Any] = Field(default_factory=dict)
