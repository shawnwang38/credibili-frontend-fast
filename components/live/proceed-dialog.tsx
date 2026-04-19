"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function ProceedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const selectedClaim = useAppStore((s) => s.selectedClaim);
  const resetPanels = useAppStore((s) => s.resetPanels);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest">
            End Live Mode?
          </DialogTitle>
          <DialogDescription style={{ color: "var(--muted-foreground)" }}>
            This will end Live mode and route to the depth analysis for the
            selected claim:
          </DialogDescription>
        </DialogHeader>
        {selectedClaim && (
          <div
            className="border px-3 py-2 text-xs"
            style={{
              borderColor: "var(--border)",
              background: "var(--background)",
            }}
          >
            <span style={{ color: "var(--accent)" }}>
              [{formatTime(selectedClaim.timestamp)}]
            </span>{" "}
            {selectedClaim.text}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              resetPanels();
              onOpenChange(false);
              router.push("/depth");
            }}
            className="uppercase tracking-widest"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Confirm → Depth Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
