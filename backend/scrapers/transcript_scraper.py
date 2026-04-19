import anthropic

client = anthropic.Anthropic()

def get_historical_transcripts(ticker: str) -> list[dict]:
    """
    Use Claude's knowledge of past earnings calls to build historical context.
    No scraping needed.
    """
    print(f"Using Claude to recall historical statements for {ticker}...")
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": f"""List 10-15 specific forward-looking statements, promises, or guidance that {ticker} executives made in their earnings calls over the past 2-3 years.

For each one include:
- What they said (exact paraphrase)
- Approximate quarter/date it was said
- Topic (revenue, margins, growth, etc)

Format each as:
DATE: [quarter]
CLAIM: [what they said]
TOPIC: [topic]

Be specific and factual. Only include real statements."""
        }]
    )
    
    text = response.content[0].text
    
    return [{
        "date": "historical",
        "title": f"{ticker} Historical Statements from Claude Knowledge",
        "url": "claude_knowledge",
        "text": text
    }]
