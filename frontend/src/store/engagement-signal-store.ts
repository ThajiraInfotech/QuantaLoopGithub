import { create } from "zustand";

import type { ActivitySignalsSummary } from "@/types/insight";

type EngagementSignalStore = {
  summary: ActivitySignalsSummary | null;
  lastFetchedAt: number | null;
  setSummary: (summary: ActivitySignalsSummary) => void;
  clear: () => void;
};

export const useEngagementSignalStore = create<EngagementSignalStore>((set) => ({
  summary: null,
  lastFetchedAt: null,
  setSummary: (summary) =>
    set({ summary, lastFetchedAt: Date.now() }),
  clear: () => set({ summary: null, lastFetchedAt: null }),
}));
