"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { getPostAuthRedirect } from "@/lib/auth-routing";
import { useAuthStore } from "@/store/auth-store";

const SKIP_PATHS = new Set<string>([
  ROUTES.verifyEmail,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]);

type AuthenticatedSessionRedirectProps = {
  children: React.ReactNode;
};

/** Sends users who already have a session away from sign-in / sign-up screens. */
export function AuthenticatedSessionRedirect({
  children,
}: AuthenticatedSessionRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authHydrated = useAuthHydration();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const skip = SKIP_PATHS.has(pathname);
  const isAuthenticated = Boolean(accessToken && user);

  useEffect(() => {
    if (skip || !authHydrated || !isAuthenticated || !user) return;
    let cancelled = false;
    void getPostAuthRedirect(user).then((destination) => {
      if (!cancelled) router.replace(destination);
    });
    return () => {
      cancelled = true;
    };
  }, [skip, authHydrated, isAuthenticated, user, router]);

  if (skip) {
    return <>{children}</>;
  }

  if (!authHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
