from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from database.db import init_db, save_claim, save_session_metrics, get_claims_for_company, get_red_flags_for_company, get_session_metrics_history, get_all_claims
from audio.stream import stream_transcript
from claude.extractor import extract_claims
from claude.scorer import score_claim, calculate_session_metrics
from financials.fetcher import get_financial_summary, format_for_claude
from scrapers.transcript_scraper import get_historical_transcripts
from models import TranscriptChunk, ScoredClaim

app = FastAPI(title="EarningsLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"status": "EarningsLens running"}


@app.get("/claims/{ticker}")
def claims_for_company(ticker: str):
    return {"ticker": ticker, "claims": get_claims_for_company(ticker.upper())}


@app.get("/redflags/{ticker}")
def red_flags(ticker: str):
    return {"ticker": ticker, "red_flags": get_red_flags_for_company(ticker.upper())}


@app.get("/metrics/{ticker}")
def metrics_history(ticker: str):
    return {"ticker": ticker, "history": get_session_metrics_history(ticker.upper())}


@app.get("/financials/{ticker}")
def financials(ticker: str):
    return get_financial_summary(ticker.upper())


@app.get("/claims")
def all_claims():
    return {"claims": get_all_claims()}


@app.get("/historical/{ticker}")
def historical(ticker: str):
    results = get_historical_transcripts(ticker.upper())
    return {"ticker": ticker, "articles": len(results), "data": results}


@app.websocket("/ws/analyze")
async def analyze_stream(websocket: WebSocket):
    await websocket.accept()

    session_claims = []
    financial_context = ""
    ticker = "UNKNOWN"

    try:
        data = await websocket.receive_json()
        youtube_url = data.get("youtube_url")
        ticker = data.get("ticker", "UNKNOWN").upper()

        if not youtube_url:
            await websocket.send_json({"error": "youtube_url is required"})
            return

        await websocket.send_json({"status": "starting", "ticker": ticker})

        await websocket.send_json({"status": "fetching_financials"})
        financial_summary = get_financial_summary(ticker)
        financial_context = format_for_claude(financial_summary)
        await websocket.send_json({
            "status": "financials_ready",
            "summary": financial_summary
        })

        await websocket.send_json({"status": "fetching_historical_context"})
        historical = get_historical_transcripts(ticker)
        if historical:
            historical_text = "\n\n---HISTORICAL STATEMENTS---\n"
            for h in historical:
                historical_text += f"\n{h['date']}: {h['text'][:3000]}\n"
            financial_context += historical_text
            await websocket.send_json({
                "status": "historical_ready",
                "articles_found": len(historical)
            })
        else:
            await websocket.send_json({
                "status": "historical_ready",
                "articles_found": 0
            })

        async def on_chunk(chunk: TranscriptChunk):
            await websocket.send_json({
                "type": "transcript",
                "timestamp": chunk.timestamp,
                "speaker": chunk.speaker,
                "text": chunk.text
            })

            claims = await extract_claims(chunk)

            loop = asyncio.get_event_loop()
            for claim in claims:
                scored = await loop.run_in_executor(None, score_claim, claim, financial_context)
                save_claim(scored)
                session_claims.append(scored)

                await websocket.send_json({
                    "type": "claim",
                    "data": scored.model_dump()
                })

                if scored.is_red_flag:
                    await websocket.send_json({
                        "type": "red_flag",
                        "data": {
                            "text": scored.text,
                            "reason": scored.red_flag_reason,
                            "timestamp": scored.timestamp
                        }
                    })

        await stream_transcript(youtube_url, ticker, on_chunk)

        await websocket.send_json({"status": "calculating_metrics"})
        metrics = calculate_session_metrics(session_claims, financial_context)
        save_session_metrics(metrics, ticker)
        await websocket.send_json({
            "type": "session_metrics",
            "data": metrics
        })

    except WebSocketDisconnect:
        print("Client disconnected")
        if session_claims:
            try:
                metrics = calculate_session_metrics(session_claims, financial_context)
                save_session_metrics(metrics, ticker)
            except:
                pass
    except Exception as e:
        print(f"Error: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
