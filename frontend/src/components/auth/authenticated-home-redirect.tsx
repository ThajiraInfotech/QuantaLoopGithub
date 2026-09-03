"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import {
  getAppHomeHref,
  userNeedsAccountSetup,
  userNeedsEmailOtp,
} from "@/lib/auth-routing";
import { useAuthStore } from "@/store/auth-store";

/** Sends signed-in visitors away from the public landing page into the app. */
export function AuthenticatedHomeRedirect() {
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!authHydrated || !accessToken || !user) return;

    if (userNeedsEmailOtp(user)) {
      router.replace(ROUTES.verifyEmail);
      return;
    }
    if (userNeedsAccountSetup(user)) {
      router.replace(ROUTES.onboardingAccount);
      return;
    }

    router.replace(getAppHomeHref(user));
  }, [authHydrated, accessToken, user, router]);

  return null;
}
