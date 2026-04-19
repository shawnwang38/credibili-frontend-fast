import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { AppUIMessage } from "@/lib/api-types";
import type { Claim, SessionMetrics } from "@/lib/schemas";
import { fixtureClaims, DEFAULT_COMPANY, DEFAULT_VIDEO_ID } from "@/lib/fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_WS = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/^http/, "ws") + "/ws/analyze";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseTimestamp(ts: string | number): number {
  if (typeof ts === "number") return ts;
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseFloat(ts) || 0;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const youtubeUrl = (body.youtubeUrl as string | undefined) || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  const ticker = (body.ticker as string | undefined) ?? DEFAULT_COMPANY.ticker;

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      let claimIndex = 0;
      let connected = false;

      try {
        const ws = new WebSocket(BACKEND_WS);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("connection timeout"));
          }, 5000);

          ws.onopen = () => {
            clearTimeout(timeout);
            connected = true;
            ws.send(JSON.stringify({ youtube_url: youtubeUrl, ticker }));
          };

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data as string) as Record<string, unknown>;

              if (msg.type === "claim") {
                const d = msg.data as Record<string, unknown>;
                claimIndex++;
                const claim: Claim = {
                  id: `c${claimIndex}`,
                  timestamp: parseTimestamp(d.timestamp as string),
                  text: (d.summary as string | undefined) ?? truncate(d.text as string, 60),
                  verbatim: d.text as string,
                  credibilityScore: d.credibility_score as number | null | undefined,
                  speaker: d.speaker as string | undefined,
                  topic: d.topic as string | null | undefined,
                  confidenceLevel: d.confidence_level as "hedged" | "moderate" | "strong" | null | undefined,
                  isRedFlag: d.is_red_flag as boolean | undefined,
                  redFlagReason: d.red_flag_reason as string | null | undefined,
                  scoreExplanation: d.score_explanation as string | null | undefined,
                };
                writer.write({ type: "data-claim", id: claim.id, data: claim });
              } else if (msg.type === "session_metrics") {
                const d = msg.data as Record<string, unknown>;
                const metrics: SessionMetrics = {
                  transparency: d.transparency as number,
                  delivery: d.delivery as number,
                  consistency: d.consistency as number,
                  industryRelativity: d.industry_relativity as number,
                  confidenceCalibration: d.confidence_calibration as number,
                  accuracy: d.accuracy as number,
                  overall: d.overall as number,
                  summary: d.summary as string,
                };
                writer.write({ type: "data-session-metrics", id: "metrics", data: metrics });
              }
            } catch {
              // ignore malformed messages
            }
          };

          ws.onclose = () => resolve();
          ws.onerror = () => reject(new Error("WebSocket error"));
        });
      } catch {
        if (connected) return; // partial success — don't overwrite with fixtures

        // Backend unavailable — stream fixture data
        await sleep(300);
        for (const claim of fixtureClaims) {
          await sleep(1200);
          writer.write({ type: "data-claim", id: claim.id, data: claim });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
