"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { AppUIMessage } from "@/lib/api-types";
import type { Claim } from "@/lib/schemas";
import { ProceedDialog } from "@/components/live/proceed-dialog";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function ClaimsPanel() {
  const transport = useMemo(
    () => new DefaultChatTransport<AppUIMessage>({ api: "/api/live-stream" }),
    [],
  );
  const { messages, sendMessage, status } = useChat<AppUIMessage>({
    transport,
  });

  const kickedOff = useRef(false);
  useEffect(() => {
    if (kickedOff.current) return;
    kickedOff.current = true;
    void sendMessage({ text: "start" });
  }, [sendMessage]);

  const claims: Claim[] = useMemo(() => {
    const out: Claim[] = [];
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type === "data-claim") {
          out.push(part.data as Claim);
        }
      }
    }
    return out;
  }, [messages]);

  const selectedClaim = useAppStore((s) => s.selectedClaim);
  const setSelectedClaim = useAppStore((s) => s.setSelectedClaim);
  const [proceedOpen, setProceedOpen] = useState(false);

  return (
    <section
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "var(--panel)" }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-[10px] uppercase tracking-widest"
        style={{
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        <span>▸ KEY CLAIMS</span>
        <span>
          {claims.length} CAPTURED
          {status === "streaming" && (
            <span style={{ color: "var(--accent)" }}> · LIVE</span>
          )}
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
                  background: active
                    ? "var(--background)"
                    : "transparent",
                  borderLeft: active
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                }}
              >
                <div
                  className="mb-1 flex justify-between text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span style={{ color: "var(--accent)" }}>
                    [{formatTime(c.timestamp)}]
                  </span>
                  <span>CLAIM {c.id.toUpperCase()}</span>
                </div>
                <div
                  className="mb-1 text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  {c.text}
                </div>
                <div
                  className="text-xs italic"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  &ldquo;{c.verbatim}&rdquo;
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="border-t px-3 py-2"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        <Button
          onClick={() => setProceedOpen(true)}
          disabled={!selectedClaim}
          className="w-full uppercase tracking-widest"
          style={{
            background: selectedClaim ? "var(--accent)" : "var(--muted)",
            color: selectedClaim
              ? "var(--accent-foreground)"
              : "var(--muted-foreground)",
          }}
        >
          {selectedClaim
            ? "Proceed to Depth Mode →"
            : "Select a claim to proceed"}
        </Button>
      </div>

      <ProceedDialog open={proceedOpen} onOpenChange={setProceedOpen} />
    </section>
  );
}
