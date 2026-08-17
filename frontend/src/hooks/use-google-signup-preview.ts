"use client";

import { previewGoogleCredentialRequest } from "@/services/auth/auth.service";
import { useOnboardingStore } from "@/store/onboarding-store";

/**
 * Verifies Google identity for sign-up only. Does not create a session.
 */
export function useGoogleSignupPreview() {
  const setPendingGoogleProfile = useOnboardingStore(
    (s) => s.setPendingGoogleProfile
  );

  async function previewGoogleSignup(credential: string) {
    const profile = await previewGoogleCredentialRequest(credential);
    setPendingGoogleProfile({
      email: profile.email,
      name: profile.name,
      credential,
    });
  }

  return { previewGoogleSignup };
}
