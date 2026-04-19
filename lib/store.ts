"use client";

import { create } from "zustand";
import type { Claim, Score } from "@/lib/schemas";
import type { FeedPanel } from "@/lib/api-types";

type PanelCompletion = Record<FeedPanel, boolean>;

type AppState = {
  selectedClaim: Claim | null;
  setSelectedClaim: (c: Claim) => void;

  panelCompletion: PanelCompletion;
  markPanelDone: (p: FeedPanel) => void;
  resetPanels: () => void;

  depthView: "analysis" | "overview";
  setDepthView: (v: "analysis" | "overview") => void;

  videoTime: number;
  setVideoTime: (t: number) => void;

  finalScore: Score | null;
  setFinalScore: (s: Score) => void;

  futureStarted: boolean;
  setFutureStarted: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedClaim: null,
  setSelectedClaim: (c) => set({ selectedClaim: c }),

  panelCompletion: {
    background: false,
    past: false,
    present: false,
    future: false,
  },
  markPanelDone: (p) =>
    set((state) => ({
      panelCompletion: { ...state.panelCompletion, [p]: true },
    })),
  resetPanels: () =>
    set({
      panelCompletion: {
        background: false,
        past: false,
        present: false,
        future: false,
      },
      finalScore: null,
      futureStarted: false,
      depthView: "analysis",
    }),

  depthView: "analysis",
  setDepthView: (v) => set({ depthView: v }),

  videoTime: 0,
  setVideoTime: (t) => set({ videoTime: t }),

  finalScore: null,
  setFinalScore: (s) => set({ finalScore: s }),

  futureStarted: false,
  setFutureStarted: (v) => set({ futureStarted: v }),
}));
