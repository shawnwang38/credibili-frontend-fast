import type { UIMessage } from "ai";
import type { Claim, Score } from "@/lib/schemas";

export type FeedPanel = "background" | "past" | "present" | "future";

export type AppDataParts = {
  claim: Claim;
  "feed-line": { panel: FeedPanel; line: string; done?: boolean };
  score: Score;
};

export type AppUIMessage = UIMessage<never, AppDataParts>;
