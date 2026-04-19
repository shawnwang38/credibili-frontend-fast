"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { AppUIMessage } from "@/lib/api-types";
import type { Claim, SessionMetrics } from "@/lib/schemas";
import { ProceedDialog } from "@/components/live/proceed-dialog";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function CredibilityBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? "var(--success)" : score >= 0.4 ? "var(--warning)" : "var(--danger)";
  return (
    <span
      className="border px-1.5 py-0.5 text-[9px] tabular-nums uppercase tracking-widest"
      style={{ borderColor: color, color }}
    >
      {pct}%
    </span>
  );
}

export function ClaimsPanel() {
  const youtubeUrl = useAppStore((s) => s.youtubeUrl);
  const ticker = useAppStore((s) => s.ticker);
  const setSessionMetrics = useAppStore((s) => s.setSessionMetrics);

  const transport = useMemo(
    () => new DefaultChatTransport<AppUIMessage>({
      api: "/api/live-stream",
      body: { youtubeUrl, ticker },
    }),
    [youtubeUrl, ticker],
  );
  const { messages, sendMessage, status } = useChat<AppUIMessage>({ transport });

  useEffect(() => {
    if (!youtubeUrl) return;
    void sendMessage({ text: "start" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeUrl]);

  const claims: Claim[] = useMemo(() => {
    const out: Claim[] = [];
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type === "data-claim") out.push(part.data as Claim);
      }
    }
    return out;
  }, [messages]);

  // Save session metrics to store when they arrive
  useEffect(() => {
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type === "data-session-metrics") {
          setSessionMetrics(part.data as SessionMetrics);
        }
      }
    }
  }, [messages, setSessionMetrics]);

  const selectedClaim = useAppStore((s) => s.selectedClaim);
  const setSelectedClaim = useAppStore((s) => s.setSelectedClaim);
  const [proceedOpen, setProceedOpen] = useState(false);

  return (
    <section className="flex h-full flex-col overflow-hidden" style={{ background: "var(--panel)" }}>
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-[10px] uppercase tracking-widest"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        <span>▸ KEY CLAIMS</span>
        <span>
          {claims.length} CAPTURED
          {status === "streaming" && <span style={{ color: "var(--accent)" }}> · LIVE</span>}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {claims.length === 0 && (
          <div
            className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Awaiting first claim...
          </div>
        )}
        <ul>
          {claims.map((c) => {
            const active = selectedClaim?.id === c.id;
            return (
              <li
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                className="cursor-pointer border-b px-3 py-3 transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: active ? "var(--background)" : "transparent",
                  borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                }}
              >
                <div
                  className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span style={{ color: "var(--accent)" }}>[{formatTime(c.timestamp)}]</span>
                  <span className="flex items-center gap-1.5">
                    {c.topic && <span>{c.topic}</span>}
                    {c.isRedFlag && (
                      <span
                        className="border px-1 py-0.5 text-[9px]"
                        style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                        title={c.redFlagReason ?? "Red flag"}
                      >
                        ⚑ FLAG
                      </span>
                    )}
                    <CredibilityBadge score={c.credibilityScore} />
                  </span>
                </div>
                <div className="mb-1 text-sm" style={{ color: "var(--foreground)" }}>
                  {c.text}
                </div>
                <div className="text-xs italic" style={{ color: "var(--muted-foreground)" }}>
                  &ldquo;{c.verbatim}&rdquo;
                </div>
                {c.scoreExplanation && (
                  <div className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.scoreExplanation}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
        <Button
          onClick={() => setProceedOpen(true)}
          disabled={!selectedClaim}
          className="w-full uppercase tracking-widest"
          style={{
            background: selectedClaim ? "var(--accent)" : "var(--muted)",
            color: selectedClaim ? "var(--accent-foreground)" : "var(--muted-foreground)",
          }}
        >
          {selectedClaim ? "Proceed to Depth Mode →" : "Select a claim to proceed"}
        </Button>
      </div>

      <ProceedDialog open={proceedOpen} onOpenChange={setProceedOpen} />
    </section>
  );
}
