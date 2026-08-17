"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/auth-store";

/** Sends provider and buyer roles to the dashboard from Phase 2 routes. */
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
