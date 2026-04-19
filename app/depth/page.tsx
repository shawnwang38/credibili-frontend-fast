"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AppUIMessage, FeedPanel } from "@/lib/api-types";
import type { Score, PastClaim, PresentState } from "@/lib/schemas";
import { useAppStore } from "@/lib/store";
import { AnalyzingBanner } from "@/components/depth/analyzing-banner";
import { BackgroundPanel } from "@/components/depth/background-panel";
import { PastCredibilityPanel } from "@/components/depth/past-credibility-panel";
import { PresentStatePanel } from "@/components/depth/present-state-panel";
import { OverviewView } from "@/components/depth/overview-view";

type FeedLineData = { panel: FeedPanel; line: string; done?: boolean };

function extractFeedLines(messages: AppUIMessage[]) {
  const map: Record<FeedPanel, { lines: string[]; done: boolean }> = {
    background: { lines: [], done: false },
    past: { lines: [], done: false },
    present: { lines: [], done: false },
    future: { lines: [], done: false },
  };
  for (const m of messages) {
    for (const part of m.parts) {
      if (part.type === "data-feed-line") {
        const d = part.data as FeedLineData;
        map[d.panel].lines.push(d.line);
        if (d.done) map[d.panel].done = true;
      }
    }
  }
  return map;
}

function extractScore(messages: AppUIMessage[]): Score | null {
  let last: Score | null = null;
  for (const m of messages) {
    for (const part of m.parts) {
      if (part.type === "data-score") last = part.data as Score;
    }
  }
  return last;
}

function extractPastClaims(messages: AppUIMessage[]): PastClaim[] | null {
  for (const m of messages) {
    for (const part of m.parts) {
      if (part.type === "data-past-claims") return part.data as PastClaim[];
    }
  }
  return null;
}

function extractPresentState(messages: AppUIMessage[]): PresentState | null {
  for (const m of messages) {
    for (const part of m.parts) {
      if (part.type === "data-present-state") return part.data as PresentState;
    }
  }
  return null;
}

export default function DepthPage() {
  const depthView = useAppStore((s) => s.depthView);
  const setDepthView = useAppStore((s) => s.setDepthView);
  const markPanelDone = useAppStore((s) => s.markPanelDone);
  const setFinalScore = useAppStore((s) => s.setFinalScore);
  const ticker = useAppStore((s) => s.ticker);

  const mainTransport = useMemo(
    () => new DefaultChatTransport<AppUIMessage>({ api: "/api/depth-stream", body: { ticker } }),
    [ticker],
  );
  const main = useChat<AppUIMessage>({ transport: mainTransport });

  const kickedOff = useRef(false);
  useEffect(() => {
    if (kickedOff.current) return;
    kickedOff.current = true;
    void main.sendMessage({ text: "begin" });
  }, [main]);

  const mainFeeds = useMemo(() => extractFeedLines(main.messages), [main.messages]);
  const partialScore = useMemo(() => extractScore(main.messages), [main.messages]);
  const pastClaims = useMemo(() => extractPastClaims(main.messages), [main.messages]);
  const presentState = useMemo(() => extractPresentState(main.messages), [main.messages]);

  useEffect(() => {
    if (mainFeeds.background.done) markPanelDone("background");
    if (mainFeeds.past.done) markPanelDone("past");
    if (mainFeeds.present.done) markPanelDone("present");
  }, [mainFeeds.background.done, mainFeeds.past.done, mainFeeds.present.done, markPanelDone]);

  useEffect(() => {
    if (partialScore) setFinalScore(partialScore);
  }, [partialScore, setFinalScore]);

  // Auto-swap to overview when background+past+present done and score is ready
  const completion = useAppStore((s) => s.panelCompletion);
  useEffect(() => {
    let cancelled = false;
    const allDone = completion.background && completion.past && completion.present;
    if (allDone && partialScore && depthView === "analysis") {
      const t = setTimeout(() => {
        if (!cancelled) setDepthView("overview");
      }, 1500);
      return () => { cancelled = true; clearTimeout(t); };
    }
  }, [completion.background, completion.past, completion.present, partialScore, depthView, setDepthView]);

  const allDone = completion.background && completion.past && completion.present;

  if (depthView === "overview") {
    return <OverviewView />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <AnalyzingBanner allDone={allDone} />
      <div
        className="grid flex-1 gap-px overflow-hidden"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          background: "var(--border)",
        }}
      >
        <BackgroundPanel lines={mainFeeds.background.lines} done={mainFeeds.background.done} />
        <PastCredibilityPanel
          lines={mainFeeds.past.lines}
          done={mainFeeds.past.done}
          pastClaims={pastClaims ?? undefined}
        />
        <PresentStatePanel
          lines={mainFeeds.present.lines}
          done={mainFeeds.present.done}
          presentState={presentState ?? undefined}
        />
        {/* Future simulation removed — overview generates on demand */}
        <div
          className="flex items-center justify-center"
          style={{ background: "var(--panel)", color: "var(--muted-foreground)" }}
        >
          <span className="text-[10px] uppercase tracking-widest">
            Future simulation — coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
