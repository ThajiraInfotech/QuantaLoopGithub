import { MembershipPaymentPage } from "@/components/onboarding/membership-payment-page";
import { RequireAuth } from "@/components/shared/require-auth";

export default function OnboardingMembershipPage() {
  return (
    <RequireAuth>
      <MembershipPaymentPage />
    </RequireAuth>
  );
}
