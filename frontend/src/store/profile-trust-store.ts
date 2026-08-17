import { create } from "zustand";

import { fetchMyProfile } from "@/services/profile/profile.service";
import { useAuthStore } from "@/store/auth-store";
import type { TrustSignals } from "@/types/profile";

type ProfileTrustState = {
  trustSignals: TrustSignals | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setTrustSignals: (signals: TrustSignals | null) => void;
  reset: () => void;
};

export const useProfileTrustStore = create<ProfileTrustState>((set) => ({
  trustSignals: null,
  loading: false,
  error: null,
  setTrustSignals: (trustSignals) => set({ trustSignals }),
  async refresh() {
    set({ loading: true, error: null });
    try {
      const { profile, trustSignals } = await fetchMyProfile();
      useAuthStore.getState().syncUser(profile);
      set({ trustSignals, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unable to load profile",
        loading: false,
      });
    }
  },
  reset: () => set({ trustSignals: null, error: null, loading: false }),
}));
