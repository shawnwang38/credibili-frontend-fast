import sqlite3
from datetime import datetime
from models import ScoredClaim

DB_PATH = "earningslens.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_ticker TEXT,
            speaker TEXT,
            text TEXT,
            timestamp TEXT,
            topic TEXT,
            is_promise INTEGER,
            is_measurable INTEGER,
            confidence_level TEXT,
            credibility_score REAL,
            score_explanation TEXT,
            historical_context TEXT,
            is_red_flag INTEGER DEFAULT 0,
            red_flag_reason TEXT,
            created_at TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS session_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_ticker TEXT,
            transparency INTEGER,
            delivery INTEGER,
            consistency INTEGER,
            industry_relativity INTEGER,
            confidence_calibration INTEGER,
            accuracy INTEGER,
            overall INTEGER,
            summary TEXT,
            created_at TEXT
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized")


def save_claim(claim: ScoredClaim):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO claims
        (company_ticker, speaker, text, timestamp, topic, is_promise,
         is_measurable, confidence_level, credibility_score, score_explanation,
         historical_context, is_red_flag, red_flag_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        claim.company_ticker,
        claim.speaker,
        claim.text,
        claim.timestamp,
        claim.topic,
        int(claim.is_promise),
        int(claim.is_measurable),
        claim.confidence_level,
        claim.credibility_score,
        claim.score_explanation,
        claim.historical_context,
        int(claim.is_red_flag),
        claim.red_flag_reason,
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()


def save_session_metrics(metrics: dict, ticker: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO session_metrics
        (company_ticker, transparency, delivery, consistency,
         industry_relativity, confidence_calibration, accuracy,
         overall, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticker,
        metrics.get("transparency", 50),
        metrics.get("delivery", 50),
        metrics.get("consistency", 50),
        metrics.get("industry_relativity", 50),
        metrics.get("confidence_calibration", 50),
        metrics.get("accuracy", 50),
        metrics.get("overall", 50),
        metrics.get("summary", ""),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()


def get_claims_for_company(ticker: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM claims WHERE company_ticker = ? ORDER BY created_at DESC", (ticker,))
    rows = c.fetchall()
    conn.close()
    return rows


def get_red_flags_for_company(ticker: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM claims WHERE company_ticker = ? AND is_red_flag = 1 ORDER BY created_at DESC", (ticker,))
    rows = c.fetchall()
    conn.close()
    return rows


def get_session_metrics_history(ticker: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM session_metrics WHERE company_ticker = ? ORDER BY created_at DESC", (ticker,))
    rows = c.fetchall()
    conn.close()
    return rows


def get_all_claims():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM claims ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    return rows
