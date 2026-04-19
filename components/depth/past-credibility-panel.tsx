"use client";

import { WipFeed } from "@/components/depth/wip-feed";
import { fixturePastClaims } from "@/lib/fixtures";
import type { PastClaim } from "@/lib/schemas";

export function PastCredibilityPanel({
  lines,
  done,
  pastClaims,
}: {
  lines: string[];
  done: boolean;
  pastClaims?: PastClaim[];
}) {
  const claims = pastClaims ?? fixturePastClaims;
  const delivered = claims.filter((c) => c.delivered).length;
  const rate = claims.length > 0 ? Math.round((delivered / claims.length) * 100) : 0;

  return (
    <WipFeed title="PAST CREDIBILITY" lines={lines} done={done}>
      <div
        className="flex items-baseline justify-between border-b px-3 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          Past delivery rate
        </span>
        <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
          {rate}%
        </span>
      </div>
      <ul>
        {claims.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 border-b px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="tabular-nums" style={{ color: "var(--muted-foreground)" }}>
              {c.year}
            </span>
            <span className="flex-1" style={{ color: "var(--foreground)" }}>
              {c.text}
            </span>
            <span
              className="border px-2 py-0.5 text-[9px] uppercase tracking-widest"
              style={{
                borderColor: c.delivered ? "var(--success)" : "var(--danger)",
                color: c.delivered ? "var(--success)" : "var(--danger)",
              }}
            >
              {c.delivered ? "MET" : "UNMET"}
            </span>
          </li>
        ))}
      </ul>
    </WipFeed>
  );
}
