import anthropic
import json
import asyncio
from models import TranscriptChunk, ExtractedClaim

client = anthropic.Anthropic()

EXTRACTION_PROMPT = """You are analyzing a chunk of an earnings call transcript.

Your job is to extract any forward-looking statements, promises, or significant claims.

For each claim found, return a JSON object with:
- "text": the exact verbatim quote from the transcript
- "summary": a 5-8 word plain-English label for the claim (e.g. "Positive operating margin by Q4 2026")
- "is_promise": true if it's forward-looking or a commitment, false if just factual
- "topic": one of [margins, revenue, growth, profitability, guidance, market_expansion, cost_control, product, other]
- "confidence_level": one of [hedged, moderate, strong]
- "is_measurable": true if this can be checked against actual financial numbers

Return ONLY a JSON array. No explanation, no markdown, no preamble.
If there are no significant claims, return an empty array [].

Transcript chunk:
{text}"""


async def extract_claims(chunk: TranscriptChunk) -> list[ExtractedClaim]:
    try:
        print(f"  Extracting claims from: {chunk.text[:80]}...")
        
        # Run blocking Claude call in thread pool so it doesn't block WebSocket
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": EXTRACTION_PROMPT.format(text=chunk.text)
            }]
        ))

        raw = response.content[0].text.strip()
        print(f"  Claude returned: {raw[:100]}")

        try:
            claims_data = json.loads(raw)
        except json.JSONDecodeError:
            print(f"  Invalid JSON: {raw}")
            return []

        claims = []
        for item in claims_data:
            claim = ExtractedClaim(
                speaker=chunk.speaker,
                text=item.get("text", ""),
                summary=item.get("summary"),
                timestamp=chunk.timestamp,
                company_ticker=chunk.company_ticker,
                is_promise=item.get("is_promise", False),
                topic=item.get("topic"),
                confidence_level=item.get("confidence_level"),
                is_measurable=item.get("is_measurable", False)
            )
            claims.append(claim)

        print(f"  Found {len(claims)} claims")
        return claims

    except Exception as e:
        print(f"  EXTRACTOR ERROR: {e}")
        return []
