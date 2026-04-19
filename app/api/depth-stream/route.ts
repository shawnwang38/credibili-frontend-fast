import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { AppUIMessage, FeedPanel } from "@/lib/api-types";
import {
  fixtureFeedLines,
  fixtureScoreNoFuture,
  fixtureScoreWithFuture,
} from "@/lib/fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (base: number, spread = 200) =>
  base + Math.floor(Math.random() * spread);

type Writer = Parameters<
  NonNullable<Parameters<typeof createUIMessageStream<AppUIMessage>>[0]["execute"]>
>[0]["writer"];

async function streamPanel(writer: Writer, panel: FeedPanel, baseDelay = 350) {
  const lines = fixtureFeedLines[panel];
  for (let i = 0; i < lines.length; i++) {
    await sleep(jitter(baseDelay));
    writer.write({
      type: "data-feed-line",
      id: `${panel}-${i}`,
      data: {
        panel,
        line: lines[i],
        done: i === lines.length - 1,
      },
    });
  }
}

async function streamPanelsConcurrent(
  writer: Writer,
  panels: FeedPanel[],
  baseDelay = 350,
) {
  // Interleave panel lines to feel concurrent.
  await Promise.all(panels.map((p) => streamPanel(writer, p, baseDelay)));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as { runFuture?: boolean });
  const runFuture = Boolean((body as { runFuture?: boolean }).runFuture);

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      await sleep(250);

      if (runFuture) {
        // Second invocation: only stream the future panel (past+present already done client-side).
        await streamPanel(writer, "future", 320);
        writer.write({
          type: "data-score",
          id: "score-final",
          data: fixtureScoreWithFuture,
        });
        return;
      }

      // First invocation: background -> then past+present in parallel
      await streamPanel(writer, "background", 280);
      await streamPanelsConcurrent(writer, ["past", "present"], 380);

      writer.write({
        type: "data-score",
        id: "score-partial",
        data: fixtureScoreNoFuture,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
