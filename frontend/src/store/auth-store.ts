import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { User, UserRole } from "@/types/user";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  setSession: (payload: { user: User; accessToken: string }) => void;
  syncUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) =>
        set({ user, accessToken }),
      syncUser: (user) => set({ user }),
      setRole: (role) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, role } });
      },
      clearSession: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "ql-auth",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
