"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { DEFAULT_CLAIM, DEFAULT_COMPANY } from "@/lib/fixtures";

type Verdict = "Likely" | "Mixed" | "Unlikely";

function computeVerdict(scores: number[]): Verdict {
  if (scores.length === 0) return "Mixed";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 70) return "Likely";
  if (avg >= 50) return "Mixed";
  return "Unlikely";
}

const VERDICT_COLOR: Record<Verdict, string> = {
  Likely: "var(--success)",
  Mixed: "var(--warning)",
  Unlikely: "var(--danger)",
};

export function OverviewView() {
  const setDepthView = useAppStore((s) => s.setDepthView);
  const finalScore = useAppStore((s) => s.finalScore);
  const selectedClaim = useAppStore((s) => s.selectedClaim);

  const past = finalScore?.pastDelivery ?? 62;
  const current = finalScore?.currentMarket ?? 54;
  const future = finalScore?.futureSimulation;
  const futureLabel = future == null ? "NOT RUN" : String(future);

  const present = [past, current, ...(future != null ? [future] : [])];
  const verdict: Verdict = computeVerdict(present);
  const claimText = selectedClaim?.text ?? DEFAULT_CLAIM;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div
        className="flex items-center justify-between border-b px-6 py-3 text-[10px] uppercase tracking-widest"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        <span>▸ DEPTH OVERVIEW · {DEFAULT_COMPANY.ticker}</span>
        <span style={{ color: "var(--success)" }}>● COMPLETE</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-8 py-10">
        <div className="w-full max-w-4xl">
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Selected claim
          </div>
          <div
            className="mt-2 text-xl"
            style={{ color: "var(--foreground)" }}
          >
            “{claimText}”
          </div>

          <div
            className="mt-8 grid grid-cols-3 gap-px"
            style={{ background: "var(--border)" }}
          >
            <ScoreTile label="PAST DELIVERY" value={String(past)} />
            <ScoreTile label="CURRENT MARKET" value={String(current)} />
            <ScoreTile
              label="FUTURE SIMULATION"
              value={futureLabel}
              dim={future == null}
            />
          </div>

          <div
            className="mt-px flex items-center justify-between border-t px-6 py-5"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-col">
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                Verdict
              </span>
              <span
                className="text-3xl font-bold uppercase tracking-widest"
                style={{ color: VERDICT_COLOR[verdict] }}
              >
                {verdict.toUpperCase()}
              </span>
            </div>
            <div
              className="max-w-md text-right text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {verdict === "Likely" &&
                "Past delivery, market position and stakeholder dynamics all support this claim."}
              {verdict === "Mixed" &&
                "Some signals support the claim; others raise caution. Read the breakdown."}
              {verdict === "Unlikely" &&
                "Past underperformance and current pressure make this claim hard to deliver."}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setDepthView("analysis")}
              className="uppercase tracking-widest"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                background: "transparent",
              }}
            >
              ← Back to analysis breakdown
            </Button>
            <div
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              {DEFAULT_COMPANY.name} · {DEFAULT_COMPANY.sector} ·{" "}
              {DEFAULT_COMPANY.marketCap}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  dim,
}: {
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-8"
      style={{ background: "var(--panel)" }}
    >
      <div
        className="text-[10px] uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </div>
      <div
        className="mt-3 text-6xl font-bold tabular-nums"
        style={{
          color: dim ? "var(--muted-foreground)" : "var(--accent)",
        }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-[9px] uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {dim ? "Skipped" : "/ 100"}
      </div>
    </div>
  );
}
