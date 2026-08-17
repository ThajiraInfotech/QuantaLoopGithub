import { create } from "zustand";

import type { Reminder } from "@/types/reminder";

type ReminderStore = {
  items: Reminder[];
  setItems: (items: Reminder[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useReminderStore = create<ReminderStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((r) => r.id !== id) })),
  clear: () => set({ items: [] }),
}));
