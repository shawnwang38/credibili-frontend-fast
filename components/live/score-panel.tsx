"use client";

import { useAppStore } from "@/lib/store";
import type { SessionMetrics } from "@/lib/schemas";

const METRIC_LABELS: { key: keyof SessionMetrics; label: string }[] = [
  { key: "transparency", label: "TRANSPARENCY" },
  { key: "accuracy", label: "ACCURACY" },
  { key: "consistency", label: "CONSISTENCY" },
  { key: "industryRelativity", label: "INDUSTRY" },
];

function verdictFromScore(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "LIKELY", color: "var(--success)" };
  if (score >= 40) return { label: "MIXED", color: "var(--warning)" };
  return { label: "UNLIKELY", color: "var(--danger)" };
}

export function ScorePanel() {
  const metrics = useAppStore((s) => s.sessionMetrics);

  const overall = metrics?.overall ?? null;
  const verdict = overall !== null ? verdictFromScore(overall) : null;

  return (
    <section
      className="flex h-full flex-col overflow-hidden border-r"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div
        className="border-b px-3 py-2 text-[10px] uppercase tracking-widest"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        ▸ CREDIBILITY SCORE
      </div>
      <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="flex flex-col items-center justify-center gap-1 px-4 py-4"
          style={{ background: "var(--panel)" }}
        >
          {overall !== null ? (
            <>
              <div className="text-5xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                {overall}
              </div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                Overall
              </div>
              <div className="text-sm uppercase tracking-widest" style={{ color: verdict!.color }}>
                {verdict!.label}
              </div>
              {metrics?.summary && (
                <div className="mt-2 text-center text-[9px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {metrics.summary}
                </div>
              )}
            </>
          ) : (
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Awaiting analysis…
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 px-4 py-3" style={{ background: "var(--panel)" }}>
          {METRIC_LABELS.map(({ key, label }) => {
            const value = metrics?.[key] as number | undefined;
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  <span>{label}</span>
                  <span style={{ color: "var(--foreground)" }}>{value ?? "—"}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: value != null ? `${value}%` : "0%", background: "var(--accent)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
