import { create } from "zustand";

import type { TimelineEvent } from "@/types/timeline";

type ActivityFeedStore = {
  items: TimelineEvent[];
  setItems: (items: TimelineEvent[]) => void;
  clear: () => void;
};

export const useActivityFeedStore = create<ActivityFeedStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}));
