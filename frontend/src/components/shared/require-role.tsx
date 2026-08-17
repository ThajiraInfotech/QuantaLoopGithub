"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/user";

type RequireRoleProps = {
  roles: readonly UserRole[];
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: RequireRoleProps) {
  const router = useRouter();
  const hydrated = useAuthHydration();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || !user) {
      router.replace(ROUTES.login);
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace(ROUTES.dashboard);
    }
  }, [accessToken, hydrated, roles, router, user]);

  if (!hydrated || !accessToken || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
