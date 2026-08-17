"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ROUTES } from "@/constants/routes";
import { useRequireOnboardingRole } from "@/hooks/use-require-onboarding-role";

/**
 * Industry is optional and configured later in company profile.
 * During signup, redirect to material categories (MVP matching input).
 */
export default function OnboardingIndustryPage() {
  const router = useRouter();
  const role = useRequireOnboardingRole();

  useEffect(() => {
    if (role) {
      router.replace(ROUTES.onboardingMaterials);
    }
  }, [role, router]);

  return (
    <OnboardingShell
      activeStep={2}
      title="Redirecting…"
      description="Material categories are collected on the next step."
    >
      <p className="text-sm text-zinc-600">Taking you to material category selection…</p>
    </OnboardingShell>
  );
}
