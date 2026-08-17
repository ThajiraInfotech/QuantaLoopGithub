"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isLocationDraftComplete } from "@/lib/location-profile";
import { isMaterialsDraftComplete } from "@/lib/onboarding-readiness";
import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useOnboardingHydration } from "@/hooks/use-onboarding-hydration";
import {
  normalizeLocationDraft,
  useOnboardingStore,
} from "@/store/onboarding-store";
import { useAuthStore } from "@/store/auth-store";

/**
 * Ensures role, material categories, and location drafts are set before account setup.
 * The draft only gates users who have no account yet. Once a session exists the draft
 * is cleared on purpose, and bouncing on the now-empty draft would drag a freshly
 * registered user back to role selection instead of letting them reach membership.
 */
export function useRequireOnboardingMatchingProfile() {
  const router = useRouter();
  const onboardingHydrated = useOnboardingHydration();
  const authHydrated = useAuthHydration();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const pendingSignupRole = useOnboardingStore((s) => s.pendingSignupRole);
  const draftMaterials = useOnboardingStore((s) => s.draftMaterials);
  const draftLocation = normalizeLocationDraft(
    useOnboardingStore((s) => s.draftLocation),
  );

  const materialsReady = isMaterialsDraftComplete(draftMaterials);
  const locationReady = isLocationDraftComplete(draftLocation);
  const roleReady = Boolean(pendingSignupRole);
  // A session means the account exists: OTP, account setup, and membership all
  // live past this step, so the signup draft no longer decides where to be.
  const hasAccount = Boolean(accessToken && user);

  useEffect(() => {
    if (!onboardingHydrated || !authHydrated) return;
    if (hasAccount) return;

    if (!roleReady) {
      router.replace(ROUTES.onboardingRole);
      return;
    }
    if (!materialsReady) {
      router.replace(ROUTES.onboardingMaterials);
      return;
    }
    if (!locationReady) {
      router.replace(ROUTES.onboardingLocation);
    }
  }, [
    onboardingHydrated,
    authHydrated,
    hasAccount,
    roleReady,
    materialsReady,
    locationReady,
    router,
  ]);

  return {
    pendingSignupRole,
    draftMaterials,
    draftLocation,
    isReady:
      hasAccount ||
      (onboardingHydrated && roleReady && materialsReady && locationReady),
  };
}
