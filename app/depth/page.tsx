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
import { FutureSimulationPanel } from "@/components/depth/future-simulation-panel";
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
  const setFutureStarted = useAppStore((s) => s.setFutureStarted);
  const futureStarted = useAppStore((s) => s.futureStarted);
  const ticker = useAppStore((s) => s.ticker);

  // Primary chat: background + past + present + partial score
  const mainTransport = useMemo(
    () => new DefaultChatTransport<AppUIMessage>({ api: "/api/depth-stream", body: { ticker } }),
    [ticker],
  );
  const main = useChat<AppUIMessage>({ transport: mainTransport });

  // Future chat (kicked when user clicks Start) — body.runFuture=true tells route to stream future panel
  const futureTransport = useMemo(
    () =>
      new DefaultChatTransport<AppUIMessage>({
        api: "/api/depth-stream",
        body: { runFuture: true },
      }),
    [],
  );
  const future = useChat<AppUIMessage>({ transport: futureTransport });

  const kickedOff = useRef(false);
  useEffect(() => {
    if (kickedOff.current) return;
    kickedOff.current = true;
    void main.sendMessage({ text: "begin" });
  }, [main]);

  const mainFeeds = useMemo(() => extractFeedLines(main.messages), [main.messages]);
  const futureFeeds = useMemo(() => extractFeedLines(future.messages), [future.messages]);
  const partialScore = useMemo(() => extractScore(main.messages), [main.messages]);
  const pastClaims = useMemo(() => extractPastClaims(main.messages), [main.messages]);
  const presentState = useMemo(() => extractPresentState(main.messages), [main.messages]);
  const finalFutureScore = useMemo(
    () => extractScore(future.messages),
    [future.messages],
  );

  // Mark panel completion in store as their done flags arrive
  useEffect(() => {
    if (mainFeeds.background.done) markPanelDone("background");
    if (mainFeeds.past.done) markPanelDone("past");
    if (mainFeeds.present.done) markPanelDone("present");
  }, [mainFeeds.background.done, mainFeeds.past.done, mainFeeds.present.done, markPanelDone]);

  useEffect(() => {
    if (futureFeeds.future.done) markPanelDone("future");
  }, [futureFeeds.future.done, markPanelDone]);

  // Save score (final = future score if available, else partial)
  useEffect(() => {
    const sc = finalFutureScore ?? partialScore;
    if (sc) setFinalScore(sc);
  }, [partialScore, finalFutureScore, setFinalScore]);

  // Auto-swap to overview when:
  // - future was run AND its score has arrived, OR
  // - past+present done AND user has decided not to start future (we wait for the partial score)
  const completion = useAppStore((s) => s.panelCompletion);
  useEffect(() => {
    let cancelled = false;
    const allRequiredDone =
      completion.background &&
      completion.past &&
      completion.present &&
      (futureStarted ? completion.future : true);
    const haveScore = futureStarted ? !!finalFutureScore : !!partialScore;
    if (allRequiredDone && haveScore && depthView === "analysis") {
      const t = setTimeout(() => {
        if (!cancelled) setDepthView("overview");
      }, 1500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
  }, [
    completion.background,
    completion.past,
    completion.present,
    completion.future,
    futureStarted,
    finalFutureScore,
    partialScore,
    depthView,
    setDepthView,
  ]);

  const allDone =
    completion.background &&
    completion.past &&
    completion.present &&
    (futureStarted ? completion.future : true);

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
        <BackgroundPanel
          lines={mainFeeds.background.lines}
          done={mainFeeds.background.done}
        />
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
        <FutureSimulationPanel
          lines={futureFeeds.future.lines}
          done={futureFeeds.future.done}
          onStart={() => {
            setFutureStarted(true);
            void future.sendMessage({ text: "future" });
          }}
        />
      </div>
    </div>
  );
}
