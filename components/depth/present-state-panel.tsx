"use client";

import { WipFeed } from "@/components/depth/wip-feed";
import { fixturePresentState } from "@/lib/fixtures";
import type { PresentState } from "@/lib/schemas";

export function PresentStatePanel({
  lines,
  done,
  presentState,
}: {
  lines: string[];
  done: boolean;
  presentState?: PresentState;
}) {
  const state = presentState ?? fixturePresentState;
  const f = state.financials;

  return (
    <WipFeed title="PRESENT STATE" lines={lines} done={done}>
      <div
        className="grid grid-cols-3 gap-px border-b"
        style={{ background: "var(--border)", borderColor: "var(--border)" }}
      >
        <Stat label="REVENUE" value={f.revenue} />
        <Stat label="OP MARGIN" value={f.margin} negative={f.margin.startsWith("-")} />
        <Stat label="GROWTH" value={f.growth} positive={f.growth.startsWith("+")} />
      </div>
      <div className="border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <div className="mb-1 text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          Current claims
        </div>
        <ul className="space-y-0.5">
          {state.currentClaims.map((c, i) => (
            <li key={i} className="text-xs" style={{ color: "var(--foreground)" }}>
              · {c}
            </li>
          ))}
        </ul>
      </div>
      {state.competitors.length > 0 && (
        <div className="px-3 py-2">
          <div className="mb-1 text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
            Competitor claims
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                <th className="py-1 text-left">Name</th>
                <th className="py-1 text-left">Claim</th>
                <th className="py-1 text-right">Rev</th>
              </tr>
            </thead>
            <tbody>
              {state.competitors.map((c) => (
                <tr key={c.name} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1" style={{ color: "var(--foreground)" }}>{c.name}</td>
                  <td className="py-1" style={{ color: "var(--muted-foreground)" }}>{c.claim}</td>
                  <td className="py-1 text-right tabular-nums" style={{ color: "var(--foreground)" }}>{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WipFeed>
  );
}

function Stat({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  const color = positive ? "var(--success)" : negative ? "var(--danger)" : "var(--foreground)";
  return (
    <div className="px-3 py-2" style={{ background: "var(--panel)" }}>
      <div className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </div>
      <div className="text-base tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
