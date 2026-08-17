import { OnboardingGuestGuard } from "@/components/onboarding/onboarding-guest-guard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuestGuard>{children}</OnboardingGuestGuard>;
}
