"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useOnboardingHydration } from "@/hooks/use-onboarding-hydration";
import { isMaterialsDraftComplete } from "@/lib/onboarding-readiness";
import { useOnboardingStore } from "@/store/onboarding-store";

type RequireOnboardingRoleOptions = {
  /** Location and later steps also need material categories. */
  materials?: boolean;
};

/** Ensures earlier onboarding drafts exist before a later guest step renders. */
export function useRequireOnboardingRole(
  options: RequireOnboardingRoleOptions = {}
) {
  const router = useRouter();
  const hydrated = useOnboardingHydration();
  const pendingSignupRole = useOnboardingStore((s) => s.pendingSignupRole);
  const draftMaterials = useOnboardingStore((s) => s.draftMaterials);
  const requireMaterials = Boolean(options.materials);

  useEffect(() => {
    if (!hydrated) return;
    if (!pendingSignupRole) {
      router.replace(ROUTES.onboardingRole);
      return;
    }
    if (requireMaterials && !isMaterialsDraftComplete(draftMaterials)) {
      router.replace(ROUTES.onboardingMaterials);
    }
  }, [
    draftMaterials,
    hydrated,
    pendingSignupRole,
    requireMaterials,
    router,
  ]);

  return hydrated ? pendingSignupRole : null;
}
