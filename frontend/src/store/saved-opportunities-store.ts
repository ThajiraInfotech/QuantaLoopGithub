import { create } from "zustand";

import type { SavedMaterialRow } from "@/types/saved-material";

type SavedOpportunitiesStore = {
  items: SavedMaterialRow[];
  setItems: (items: SavedMaterialRow[]) => void;
  removeByMaterialId: (materialId: string) => void;
  clear: () => void;
};

export const useSavedOpportunitiesStore = create<SavedOpportunitiesStore>(
  (set) => ({
    items: [],
    setItems: (items) => set({ items }),
    removeByMaterialId: (materialId) =>
      set((s) => ({
        items: s.items.filter((row) => row.materialId !== materialId),
      })),
    clear: () => set({ items: [] }),
  })
);
