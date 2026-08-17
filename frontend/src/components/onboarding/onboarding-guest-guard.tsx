"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { getPostAuthRedirect } from "@/lib/auth-routing";
import { useAuthStore } from "@/store/auth-store";

type OnboardingGuestGuardProps = {
  children: React.ReactNode;
};

// Steps that collect details before the account exists. They are driven by the
// signup draft, so a signed-in user has nothing left to do on them.
const PRE_ACCOUNT_PATHS = new Set<string>([
  ROUTES.onboardingRole,
  ROUTES.onboardingIndustry,
  ROUTES.onboardingMaterials,
  ROUTES.onboardingLocation,
]);

/**
 * Keeps the signup steps for guests only. Once an account exists the single
 * post-auth rule decides where the user belongs — email verification, account
 * setup, membership, or the dashboard — so nobody is dragged back to step 1.
 */
export function OnboardingGuestGuard({ children }: OnboardingGuestGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const hasAccount = Boolean(accessToken && user);
  const leaveSignupSteps =
    authHydrated && hasAccount && PRE_ACCOUNT_PATHS.has(pathname);

  useEffect(() => {
    if (!leaveSignupSteps || !user) return;

    let cancelled = false;
    void getPostAuthRedirect(user).then((destination) => {
      if (!cancelled) router.replace(destination);
    });

    return () => {
      cancelled = true;
    };
  }, [leaveSignupSteps, router, user]);

  if (!authHydrated || leaveSignupSteps) {
    return null;
  }

  return <>{children}</>;
}
