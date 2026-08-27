import type { Metadata } from "next";

import { OnboardingGuestGuard } from "@/components/onboarding/onboarding-guest-guard";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuestGuard>{children}</OnboardingGuestGuard>;
}
