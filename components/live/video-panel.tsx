"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { DEFAULT_VIDEO_ID, DEFAULT_COMPANY } from "@/lib/fixtures";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export function VideoPanel() {
  const setVideoTime = useAppStore((s) => s.setVideoTime);

  return (
    <section
      className="flex h-full flex-col overflow-hidden border-r border-b"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <PanelHeader />
      <div className="relative flex-1 overflow-hidden bg-black">
        <ReactPlayer
          src={`https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`}
          width="100%"
          height="100%"
          controls
          onTimeUpdate={(e) => {
            const t = (e.currentTarget as HTMLMediaElement).currentTime;
            if (typeof t === "number") setVideoTime(t);
          }}
        />
      </div>
    </section>
  );
}

function PanelHeader() {
  return (
    <div
      className="flex items-center justify-between border-b px-3 py-2 text-[10px] uppercase tracking-widest"
      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
    >
      <span>
        ▸ EARNINGS CALL —{" "}
        <span style={{ color: "var(--foreground)" }}>{DEFAULT_COMPANY.name}</span>{" "}
        ({DEFAULT_COMPANY.ticker})
      </span>
      <span>{DEFAULT_COMPANY.sector} · {DEFAULT_COMPANY.marketCap}</span>
    </div>
  );
}
