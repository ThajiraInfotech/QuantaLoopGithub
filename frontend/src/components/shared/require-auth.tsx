"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import {
  userNeedsAccountSetup,
  userNeedsEmailOtp,
} from "@/lib/auth-routing";
import { useAuthStore } from "@/store/auth-store";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const hydrated = useAuthHydration();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(ROUTES.login);
      return;
    }
    // Manual email signups must verify OTP before using the app.
    // Google accounts skip OTP (already verified by Google).
    if (userNeedsEmailOtp(user)) {
      router.replace(ROUTES.verifyEmail);
      return;
    }
    if (user && userNeedsAccountSetup(user)) {
      router.replace(ROUTES.onboardingAccount);
    }
  }, [accessToken, hydrated, router, user]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Loading session…
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  if (userNeedsEmailOtp(user)) {
    return null;
  }

  if (user && userNeedsAccountSetup(user)) {
    return null;
  }

  return <>{children}</>;
}
