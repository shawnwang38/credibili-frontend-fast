"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { DEFAULT_COMPANY } from "@/lib/fixtures";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

export function VideoPanel() {
  const setVideoTime = useAppStore((s) => s.setVideoTime);
  const youtubeUrl = useAppStore((s) => s.youtubeUrl);
  const setLiveContext = useAppStore((s) => s.setLiveContext);
  const ticker = useAppStore((s) => s.ticker);

  const [input, setInput] = useState("");
  const [tickerInput, setTickerInput] = useState(ticker);
  const [error, setError] = useState<string | null>(null);

  const isPlaying = !!youtubeUrl && youtubeUrl.includes("youtube.com/watch");

  function handleLoad() {
    const id = extractVideoId(input.trim());
    if (!id) {
      setError("Invalid YouTube URL");
      return;
    }
    setError(null);
    setLiveContext(`https://www.youtube.com/watch?v=${id}`, tickerInput.trim().toUpperCase() || DEFAULT_COMPANY.ticker);
  }

  return (
    <section
      className="flex h-full flex-col overflow-hidden border-r border-b"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-[10px] uppercase tracking-widest"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        <span>▸ EARNINGS CALL</span>
        {isPlaying && (
          <span style={{ color: "var(--foreground)" }}>
            {ticker}
          </span>
        )}
      </div>

      {!isPlaying ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <div className="w-full">
            <label className="mb-1 block text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              YouTube URL
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border bg-transparent px-2 py-1.5 text-xs outline-none"
              style={{
                borderColor: error ? "var(--danger)" : "var(--border)",
                color: "var(--foreground)",
              }}
            />
            {error && (
              <div className="mt-1 text-[9px]" style={{ color: "var(--danger)" }}>{error}</div>
            )}
          </div>
          <div className="w-full">
            <label className="mb-1 block text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Ticker Symbol
            </label>
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              placeholder="AAPL"
              className="w-full border bg-transparent px-2 py-1.5 text-xs uppercase outline-none"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <button
            onClick={handleLoad}
            className="w-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
            style={{
              borderColor: "var(--accent)",
              color: "var(--accent)",
              background: "transparent",
            }}
          >
            Load Video →
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden bg-black">
            <ReactPlayer
              src={youtubeUrl}
              width="100%"
              height="100%"
              controls
              onTimeUpdate={(e) => {
                const t = (e.currentTarget as HTMLMediaElement).currentTime;
                if (typeof t === "number") setVideoTime(t);
              }}
            />
          </div>
          <button
            onClick={() => { setInput(""); setLiveContext("", ticker); }}
            className="border-t px-3 py-1 text-[9px] uppercase tracking-widest transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--panel)" }}
          >
            ← Change video
          </button>
        </>
      )}
    </section>
  );
}
