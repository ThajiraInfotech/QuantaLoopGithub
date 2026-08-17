import { create } from "zustand";

import type { ActivitySignalsSummary, OperationalInsight } from "@/types/insight";

type InsightStore = {
  insights: OperationalInsight[];
  signals: ActivitySignalsSummary | null;
  setInsights: (insights: OperationalInsight[]) => void;
  setSignals: (signals: ActivitySignalsSummary | null) => void;
  clear: () => void;
};

export const useInsightStore = create<InsightStore>((set) => ({
  insights: [],
  signals: null,
  setInsights: (insights) => set({ insights }),
  setSignals: (signals) => set({ signals }),
  clear: () => set({ insights: [], signals: null }),
}));
