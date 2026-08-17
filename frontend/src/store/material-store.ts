import { create } from "zustand";

import type { Material } from "@/types/material";

type MaterialStore = {
  items: Material[];
  setItems: (items: Material[]) => void;
  upsert: (material: Material) => void;
  clear: () => void;
};

export const useMaterialStore = create<MaterialStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  upsert: (material) =>
    set((state) => {
      const idx = state.items.findIndex((m) => m.id === material.id);
      if (idx === -1) {
        return { items: [material, ...state.items] };
      }
      const next = [...state.items];
      next[idx] = material;
      return { items: next };
    }),
  clear: () => set({ items: [] }),
}));
