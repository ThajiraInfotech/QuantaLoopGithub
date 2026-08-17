import { create } from "zustand";

import { fetchAccessPlans } from "@/services/access/access.service";
import type { AccessPlansPayload } from "@/types/access";

type AccessPlanState = {
  plans: AccessPlansPayload | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
};

export const useAccessPlanStore = create<AccessPlanState>((set) => ({
  plans: null,
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      const plans = await fetchAccessPlans();
      set({ plans, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unable to load access layer",
        loading: false,
      });
    }
  },
  reset: () => set({ plans: null, error: null, loading: false }),
}));
