import type { UIMessage } from "ai";
import type { Claim, Score, SessionMetrics, PastClaim, PresentState } from "@/lib/schemas";

export type FeedPanel = "background" | "past" | "present" | "future";

export type AppDataParts = {
  claim: Claim;
  "feed-line": { panel: FeedPanel; line: string; done?: boolean };
  score: Score;
  "session-metrics": SessionMetrics;
  "past-claims": PastClaim[];
  "present-state": PresentState;
};

export type AppUIMessage = UIMessage<never, AppDataParts>;
