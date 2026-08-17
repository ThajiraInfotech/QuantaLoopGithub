"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RegisterScreen } from "@/components/auth/register-screen";
import { GoogleAccountSetupForm } from "@/components/forms/google-account-setup-form";
import { AccountSetupSignupOptions } from "@/components/onboarding/account-setup-signup-options";
import { OnboardingCompletionSummary } from "@/components/onboarding/onboarding-completion-summary";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingTrustBanner } from "@/components/onboarding/onboarding-trust-banner";
import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useRequireOnboardingMatchingProfile } from "@/hooks/use-require-onboarding-matching-profile";
import { userNeedsAccountSetup, userNeedsEmailOtp } from "@/lib/auth-routing";
import { useAuthStore } from "@/store/auth-store";

type AccountSetupPageProps = {
  googleClientId?: string;
};

export function AccountSetupPage({ googleClientId }: AccountSetupPageProps) {
  const t = useTranslations("onboarding.account");
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { isReady } = useRequireOnboardingMatchingProfile();

  // Reaching this step with a finished account (back navigation, a resumed
  // session) means only membership is left — never re-offer sign-up.
  const settledAccount = Boolean(
    authHydrated &&
      accessToken &&
      user &&
      !userNeedsEmailOtp(user) &&
      !userNeedsAccountSetup(user)
  );

  useEffect(() => {
    if (!authHydrated || !accessToken || !user) return;
    if (userNeedsEmailOtp(user)) {
      router.replace(ROUTES.verifyEmail);
      return;
    }
    if (!userNeedsAccountSetup(user)) {
      router.replace(
        user.role === "admin" ? ROUTES.admin : ROUTES.onboardingMembership
      );
    }
  }, [accessToken, authHydrated, router, user]);

  if (!isReady || settledAccount) {
    return null;
  }

  // A signed-in Google account without a password only needs the password step.
  const needsPasswordOnly = Boolean(
    authHydrated && accessToken && user && userNeedsAccountSetup(user)
  );

  return (
    <RegisterScreen
      wide
      title={t("title")}
      description={t("emailDescription")}
      summary={<OnboardingCompletionSummary />}
      onboardingProgress={
        <>
          <OnboardingProgress activeStep={4} />
          <OnboardingTrustBanner />
        </>
      }
      form={
        needsPasswordOnly ? (
          <GoogleAccountSetupForm />
        ) : (
          <AccountSetupSignupOptions googleClientId={googleClientId} />
        )
      }
    />
  );
}
