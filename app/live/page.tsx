import { VideoPanel } from "@/components/live/video-panel";
import { ScorePanel } from "@/components/live/score-panel";
import { ClaimsPanel } from "@/components/live/claims-panel";

export default function LivePage() {
  return (
    <div
      className="grid h-full w-full overflow-hidden"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
      }}
    >
      <div className="col-start-1 row-start-1 overflow-hidden">
        <VideoPanel />
      </div>
      <div className="col-start-1 row-start-2 overflow-hidden">
        <ScorePanel />
      </div>
      <div className="col-start-2 row-span-2 row-start-1 overflow-hidden border-l" style={{ borderColor: "var(--border)" }}>
        <ClaimsPanel />
      </div>
    </div>
  );
}
