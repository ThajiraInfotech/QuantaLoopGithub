"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/auth-store";

/** Sends material providers to the dashboard from buyer-only Phase 2 routes. */
export function useProviderOnlyRedirect(): boolean {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isProvider = user?.role === "material_provider";

  useEffect(() => {
    if (isProvider) {
      router.replace(ROUTES.dashboard);
    }
  }, [isProvider, router]);

  return isProvider;
}

/** Sends provider and buyer roles to the dashboard from deferred Phase 2 routes. */
export function useProviderMvpRedirect(): boolean {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isMvpRole =
    user?.role === "material_provider" || user?.role === "verified_buyer";

  useEffect(() => {
    if (isMvpRole) {
      router.replace(ROUTES.dashboard);
    }
  }, [isMvpRole, router]);

  return isMvpRole;
}
