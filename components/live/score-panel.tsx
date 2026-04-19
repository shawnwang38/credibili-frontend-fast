"use client";

const BARS: { label: string; value: number }[] = [
  { label: "TRANSPARENCY", value: 68 },
  { label: "ACCURACY", value: 74 },
  { label: "CONSISTENCY", value: 61 },
  { label: "INDUSTRY STATE", value: 80 },
];

export function ScorePanel() {
  return (
    <section
      className="flex h-full flex-col overflow-hidden border-r"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div
        className="border-b px-3 py-2 text-[10px] uppercase tracking-widest"
        style={{
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        ▸ CREDIBILITY SCORE
      </div>
      <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="flex flex-col items-center justify-center gap-1 px-4 py-4"
          style={{ background: "var(--panel)" }}
        >
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            72
          </div>
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Verdict
          </div>
          <div
            className="text-sm uppercase tracking-widest"
            style={{ color: "var(--warning)" }}
          >
            MIXED
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 py-3" style={{ background: "var(--panel)" }}>
          {BARS.map((b) => (
            <div key={b.label} className="flex flex-col gap-1">
              <div
                className="flex justify-between text-[9px] uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span>{b.label}</span>
                <span style={{ color: "var(--foreground)" }}>{b.value}</span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden"
                style={{ background: "var(--muted)" }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${b.value}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
