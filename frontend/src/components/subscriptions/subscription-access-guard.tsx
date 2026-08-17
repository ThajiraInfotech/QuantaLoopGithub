"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SubscriptionAccessProvider } from "@/components/subscriptions/subscription-access-context";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getSubscriptionAccessState } from "@/services/subscriptions/subscription.service";
import { useAuthStore } from "@/store/auth-store";
import type { SubscriptionAccessState } from "@/types/subscription";

export function SubscriptionAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const isAdmin = useAuthStore((state) => state.user?.role) === "admin";
  const [checking, setChecking] = useState(!isAdmin);
  const [access, setAccess] = useState<{
    userId: string;
    state: SubscriptionAccessState;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const allowed =
    isAdmin ||
    Boolean(
      userId &&
        access &&
        access.userId === userId &&
        access.state.entitled
    );

  const runCheck = useCallback(
    (forUserId: string) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      return getSubscriptionAccessState()
        .then((next) => {
          if (requestId.current !== currentRequest) return;
          if (useAuthStore.getState().user?.id !== forUserId) return;
          if (next.entitled) {
            setAccess({ userId: forUserId, state: next });
            setError(null);
            return;
          }
          router.replace(ROUTES.onboardingMembership);
        })
        .catch((accessError: unknown) => {
          if (requestId.current !== currentRequest) return;
          setError(
            accessError instanceof Error
              ? accessError.message
              : "Unable to confirm membership access."
          );
        })
        .finally(() => {
          if (requestId.current === currentRequest) setChecking(false);
        });
    },
    [router]
  );

  const retry = () => {
    if (!userId || isAdmin) return;
    setChecking(true);
    setError(null);
    void runCheck(userId);
  };

  useEffect(() => {
    if (!userId || isAdmin) return;
    void runCheck(userId);
  }, [isAdmin, runCheck, userId]);

  if (allowed) {
    return (
      <SubscriptionAccessProvider access={access?.state ?? null}>
        {children}
      </SubscriptionAccessProvider>
    );
  }

  if (checking || !error) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500"
        aria-busy="true"
      >
        Confirming membership access…
      </div>
    );
  }

  return (
    <div className="mx-auto my-12 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      <p role="alert">{error}</p>
      <p className="mt-2 text-amber-800">
        Access stays locked until the membership service can confirm your
        entitlement.
      </p>
      <Button className="mt-4" variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
