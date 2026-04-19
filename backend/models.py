from pydantic import BaseModel
from typing import Optional


class TranscriptChunk(BaseModel):
    speaker: Optional[str] = "Unknown"
    text: str
    timestamp: str
    company_ticker: str


class ExtractedClaim(BaseModel):
    speaker: Optional[str] = "Unknown"
    text: str           # verbatim quote
    summary: Optional[str] = None  # 5-8 word plain-English label
    timestamp: str
    company_ticker: str
    is_promise: bool
    topic: Optional[str] = None
    confidence_level: Optional[str] = None
    is_measurable: bool = False


class ScoredClaim(ExtractedClaim):
    credibility_score: Optional[float] = None
    score_explanation: Optional[str] = None
    historical_context: Optional[str] = None
    is_red_flag: bool = False
    red_flag_reason: Optional[str] = None


class SessionMetrics(BaseModel):
    company_ticker: str
    transparency: int
    delivery: int
    consistency: int
    industry_relativity: int
    confidence_calibration: int
    accuracy: int
    overall: int
    summary: str