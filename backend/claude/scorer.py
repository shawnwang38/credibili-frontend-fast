import anthropic
import json
from models import ExtractedClaim, ScoredClaim

client = anthropic.Anthropic()

SCORING_PROMPT = """You are a financial analyst assessing executive credibility.

You have been given a claim made by an executive during an earnings call,
and the actual historical financial performance of their company.

Claim: "{claim_text}"
Topic: {topic}
Confidence level used: {confidence_level}

Actual company financials:
{financial_context}

Return ONLY a JSON object with:
- "credibility_score": float from 0.0 to 1.0
- "explanation": one sentence explaining the score
- "historical_context": one sentence summarizing the relevant financial trend
- "is_red_flag": true if the language was suspiciously vague, overconfident, or deflecting
- "red_flag_reason": one sentence explaining why it's a red flag, or null if not

No markdown, no preamble, just the JSON object."""

METRICS_PROMPT = """You are a financial analyst scoring an executive's earnings call performance.

You have been given all the claims and statements extracted from an earnings call,
along with the company's historical financial performance.

Claims made during this call:
{claims}

Company financials:
{financial_context}

Score each of the following metrics from 0 to 100:

1. Transparency — did they give specific numbers or stay vague and flowery?
2. Delivery — based on historical data, have past promises been delivered on?
3. Consistency — does what they say now match what they've said in previous quarters?
4. Industry Relativity — is their performance genuinely good relative to their sector?
5. Confidence Calibration — are they appropriately confident given their actual track record?
6. Accuracy — how close have their past predictions been to actual reported numbers?

Return ONLY a JSON object with these exact keys:
{{
  "transparency": <0-100>,
  "delivery": <0-100>,
  "consistency": <0-100>,
  "industry_relativity": <0-100>,
  "confidence_calibration": <0-100>,
  "accuracy": <0-100>,
  "overall": <0-100>,
  "summary": "two sentence summary of this executive's credibility this call"
}}

No markdown, no preamble, just the JSON."""


def score_claim(claim: ExtractedClaim, financial_context: str) -> ScoredClaim:
    if not claim.is_promise and not claim.is_measurable:
        return ScoredClaim(
            **claim.model_dump(),
            credibility_score=None,
            score_explanation="Not a measurable commitment",
            historical_context=None
        )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": SCORING_PROMPT.format(
                claim_text=claim.text,
                topic=claim.topic or "general",
                confidence_level=claim.confidence_level or "unknown",
                financial_context=financial_context
            )
        }]
    )

    raw = response.content[0].text.strip()

    try:
        result = json.loads(raw)
        return ScoredClaim(
            **claim.model_dump(),
            credibility_score=result.get("credibility_score"),
            score_explanation=result.get("explanation"),
            historical_context=result.get("historical_context"),
            is_red_flag=result.get("is_red_flag", False),
            red_flag_reason=result.get("red_flag_reason")
        )
    except json.JSONDecodeError:
        return ScoredClaim(
            **claim.model_dump(),
            credibility_score=0.5,
            score_explanation="Could not parse score",
            historical_context=None,
            is_red_flag=False,
            red_flag_reason=None
        )


def calculate_session_metrics(claims: list[ScoredClaim], financial_context: str) -> dict:
    if not claims:
        return {}

    claims_text = "\n".join([
        f"- [{c.topic}] {c.text} (confidence: {c.confidence_level}, score: {c.credibility_score})"
        for c in claims
    ])

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": METRICS_PROMPT.format(
                claims=claims_text,
                financial_context=financial_context
            )
        }]
    )

    raw = response.content[0].text.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "transparency": 50,
            "delivery": 50,
            "consistency": 50,
            "industry_relativity": 50,
            "confidence_calibration": 50,
            "accuracy": 50,
            "overall": 50,
            "summary": "Could not calculate metrics"
        }
    