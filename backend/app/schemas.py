from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr


Severity = Literal["low", "medium", "high"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class DetectionResponse(BaseModel):
    id: int
    x: float
    y: float
    w: float
    h: float
    confidence: float
    severity: Severity


class DetectionSummary(BaseModel):
    count: int
    maxSeverity: Severity | None
    avgConfidence: float | None


class DetectResponse(BaseModel):
    analysisId: str
    imageUrl: str
    detections: list[DetectionResponse]
    summary: DetectionSummary


class HistoryItem(BaseModel):
    id: str
    analysisId: str
    date: date
    location: str
    lat: float | None
    lng: float | None
    roadType: str | None
    count: int
    severity: Severity | None
    avgConfidence: float | None
    imageUrl: str
