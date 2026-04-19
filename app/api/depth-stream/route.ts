import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { AppUIMessage, FeedPanel } from "@/lib/api-types";
import type { PastClaim, PresentState, Score } from "@/lib/schemas";
import {
  fixtureFeedLines,
  fixtureScoreNoFuture,
  fixtureScoreWithFuture,
  fixturePastClaims,
  fixturePresentState,
  DEFAULT_COMPANY,
} from "@/lib/fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread = 200) => base + Math.floor(Math.random() * spread);

type Writer = Parameters<
  NonNullable<Parameters<typeof createUIMessageStream<AppUIMessage>>[0]["execute"]>
>[0]["writer"];

async function streamLines(writer: Writer, panel: FeedPanel, lines: string[], baseDelay = 350) {
  for (let i = 0; i < lines.length; i++) {
    await sleep(jitter(baseDelay));
    writer.write({
      type: "data-feed-line",
      id: `${panel}-${i}`,
      data: { panel, line: lines[i], done: i === lines.length - 1 },
    });
  }
}

type BackendClaim = {
  id?: number;
  text: string;
  summary?: string | null;
  timestamp: string;
  credibility_score?: number | null;
  is_red_flag?: boolean;
  created_at?: string;
};

type BackendFinancials = {
  ticker: string;
  company_name?: string;
  quarters?: Array<{
    date: string;
    revenue: number | null;
    gross_profit: number | null;
    net_income: number | null;
    gross_margin_pct: number | null;
  }>;
  revenue_trend?: string;
  margin_trend?: string;
  data_quality?: string;
};

type BackendMetrics = {
  transparency: number;
  delivery: number;
  consistency: number;
  industry_relativity: number;
  confidence_calibration: number;
  accuracy: number;
  overall: number;
  summary: string;
};

async function fetchBackend<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function formatRevenue(rev: number | null | undefined): string {
  if (!rev) return "N/A";
  if (rev >= 1_000_000_000) return `$${(rev / 1_000_000_000).toFixed(1)}B`;
  if (rev >= 1_000_000) return `$${(rev / 1_000_000).toFixed(0)}M`;
  return `$${rev.toLocaleString()}`;
}

function scoreToVerdict(score: number): "Likely" | "Mixed" | "Unlikely" {
  if (score >= 70) return "Likely";
  if (score >= 40) return "Mixed";
  return "Unlikely";
}

function claimLabel(c: BackendClaim): string {
  return c.summary ?? (c.text.length > 60 ? c.text.slice(0, 59) + "…" : c.text);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const runFuture = Boolean(body.runFuture);
  const ticker = (body.ticker as string | undefined) ?? DEFAULT_COMPANY.ticker;

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      await sleep(250);

      if (runFuture) {
        await streamLines(writer, "future", fixtureFeedLines.future, 320);
        writer.write({ type: "data-score", id: "score-final", data: fixtureScoreWithFuture });
        return;
      }

      // Fetch all backend data in parallel
      const [claimsRes, financialsRes, metricsRes] = await Promise.all([
        fetchBackend<{ claims: BackendClaim[] }>(`/claims/${ticker}`),
        fetchBackend<BackendFinancials>(`/financials/${ticker}`),
        fetchBackend<{ history: BackendMetrics[] }>(`/metrics/${ticker}`),
      ]);

      const hasRealData = claimsRes && financialsRes;

      if (hasRealData) {
        const claims = claimsRes.claims;
        const financials = financialsRes;
        const latestMetrics = metricsRes?.history?.[0] ?? null;
        const latestQ = financials.quarters?.at(-1) ?? null;

        // --- Background panel ---
        const bgLines = [
          `Resolving company identifier ${ticker}...`,
          financials.company_name ? `Company: ${financials.company_name}` : "Fetching company profile...",
          `Financial data quality: ${financials.data_quality ?? "unknown"}`,
          `Quarters available: ${financials.quarters?.length ?? 0}`,
          financials.revenue_trend ? `Revenue trend: ${financials.revenue_trend}` : "Analyzing revenue trend...",
          financials.margin_trend ? `Margin trend: ${financials.margin_trend}` : "Analyzing margin trend...",
          "Background context assembly complete.",
        ];
        await streamLines(writer, "background", bgLines, 280);

        // --- Past + Present concurrently ---
        const deliveredCount = claims.filter((c) => (c.credibility_score ?? 0.5) >= 0.5).length;
        const deliveryRate = claims.length > 0 ? Math.round((deliveredCount / claims.length) * 100) : 0;
        const pastMetricScore = latestMetrics?.delivery ?? deliveryRate;

        const pastLines = [
          `Loading historical claims corpus for ${ticker}...`,
          `Found ${claims.length} recorded claims...`,
          `Matched claims against financial outcomes...`,
          `Delivery rate: ${deliveredCount}/${claims.length} claims met threshold...`,
          `Weighting by claim materiality...`,
          `Past delivery score: ${pastMetricScore}/100`,
          "Past panel ready.",
        ];

        const currentMarket = latestMetrics?.accuracy ?? 50;
        const grossMargin = latestQ?.gross_margin_pct != null
          ? `${latestQ.gross_margin_pct.toFixed(1)}%`
          : "N/A";
        const revenueStr = formatRevenue(latestQ?.revenue);
        const presentLines = [
          `Pulling financials for ${ticker}...`,
          `Revenue: ${revenueStr} / Gross margin: ${grossMargin}`,
          financials.revenue_trend ? `Growth: ${financials.revenue_trend}` : "Computing growth trend...",
          `Active claims: ${claims.slice(0, 4).map(claimLabel).join(" · ")}`,
          `Accuracy score: ${currentMarket}/100`,
          "Present panel ready.",
        ];

        await Promise.all([
          streamLines(writer, "past", pastLines, 380),
          streamLines(writer, "present", presentLines, 380),
        ]);

        // Emit structured data for panels
        const pastClaims: PastClaim[] = claims.slice(0, 10).map((c, i) => ({
          id: `p${i + 1}`,
          year: c.created_at ? new Date(c.created_at).getFullYear() : new Date().getFullYear(),
          text: claimLabel(c),
          delivered: (c.credibility_score ?? 0.5) >= 0.5,
        }));

        const presentState: PresentState = {
          financials: {
            revenue: revenueStr,
            margin: grossMargin,
            growth: financials.revenue_trend ?? "N/A",
          },
          currentClaims: claims.slice(0, 4).map(claimLabel),
          competitors: fixturePresentState.competitors,
        };

        writer.write({ type: "data-past-claims", id: "past-claims", data: pastClaims });
        writer.write({ type: "data-present-state", id: "present-state", data: presentState });

        const score: Score = {
          pastDelivery: pastMetricScore,
          currentMarket,
          futureSimulation: null,
          overall: scoreToVerdict(latestMetrics?.overall ?? Math.round((pastMetricScore + currentMarket) / 2)),
        };
        writer.write({ type: "data-score", id: "score-partial", data: score });
      } else {
        // Backend unavailable — use fixtures
        await streamLines(writer, "background", fixtureFeedLines.background, 280);
        await Promise.all([
          streamLines(writer, "past", fixtureFeedLines.past, 380),
          streamLines(writer, "present", fixtureFeedLines.present, 380),
        ]);
        writer.write({ type: "data-past-claims", id: "past-claims", data: fixturePastClaims });
        writer.write({ type: "data-present-state", id: "present-state", data: fixturePresentState });
        writer.write({ type: "data-score", id: "score-partial", data: fixtureScoreNoFuture });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
