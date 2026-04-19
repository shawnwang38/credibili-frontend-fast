import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { AppUIMessage } from "@/lib/api-types";
import { fixtureClaims } from "@/lib/fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      // Initial small delay so the client subscribes before first chunk
      await sleep(300);
      for (const claim of fixtureClaims) {
        await sleep(1200);
        writer.write({ type: "data-claim", id: claim.id, data: claim });
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}
