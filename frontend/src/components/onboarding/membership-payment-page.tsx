"use client";

import { CalendarDays, LockKeyhole, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useMembershipCheckout } from "@/hooks/use-membership-checkout";
import { userNeedsAccountSetup } from "@/lib/auth-routing";
import {
  cancelSignupRequest,
  logoutRequest,
} from "@/services/auth/auth.service";
import { getSubscriptionAccessState } from "@/services/subscriptions/subscription.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";

export function MembershipPaymentPage() {
  const t = useTranslations("onboarding.membership");
  const router = useRouter();
  const authHydrated = useAuthHydration();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearOnboardingDraft = useOnboardingStore(
    (state) => state.clearOnboardingDraft
  );
  const clearSession = useAuthStore((state) => state.clearSession);
  const [checking, setChecking] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";
  const sessionReady = authHydrated && Boolean(accessToken && user);

  const enterNetwork = useCallback(() => {
    router.replace(ROUTES.dashboard);
    router.refresh();
  }, [router]);

  // Loaded alongside the access check so the pay button is live immediately.
  const checkout = useMembershipCheckout({
    enabled: sessionReady && !isAdmin,
    onEntitled: enterNetwork,
  });

  const runAccessCheck = useCallback(() => {
    return getSubscriptionAccessState()
      .then((access) => {
        if (access.entitled) enterNetwork();
      })
      .catch((error: unknown) => {
        setAccessError(
          error instanceof Error ? error.message : t("checkError")
        );
      })
      .finally(() => setChecking(false));
  }, [enterNetwork, t]);

  const retryAccessCheck = () => {
    setChecking(true);
    setAccessError(null);
    void runAccessCheck();
  };

  // Signup drafts are only needed up to account creation; releasing them here
  // keeps the earlier steps from reclaiming a registered user.
  useEffect(() => {
    if (sessionReady && !isAdmin) clearOnboardingDraft();
  }, [clearOnboardingDraft, isAdmin, sessionReady]);

  // Anyone who already paid (or renewed elsewhere) skips this step entirely.
  useEffect(() => {
    if (user && userNeedsAccountSetup(user)) {
      router.replace(ROUTES.onboardingAccount);
      return;
    }
    if (isAdmin) {
      router.replace(ROUTES.admin);
      return;
    }
    if (!sessionReady) return;

    let cancelled = false;
    getSubscriptionAccessState()
      .then((access) => {
        if (!cancelled && access.entitled) enterNetwork();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAccessError(
          error instanceof Error ? error.message : t("checkError")
        );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enterNetwork, isAdmin, router, sessionReady, t, user]);

  // Payment is the last step, so this screen must still offer a way out.
  function handleSignOut() {
    setSigningOut(true);
    void logoutRequest()
      .catch(() => {
        /* cookie clear is best-effort; the local session still goes */
      })
      .finally(() => {
        clearSession();
        clearOnboardingDraft();
        router.replace(ROUTES.login);
        router.refresh();
      });
  }

  // Discards the unpaid account so the next visit starts at the first screen.
  function handleCancelSignup() {
    setCancelling(true);
    setCancelError(null);
    void cancelSignupRequest()
      .then(() => {
        clearSession();
        clearOnboardingDraft();
        router.replace(ROUTES.onboardingRole);
        router.refresh();
      })
      .catch((error: unknown) => {
        setCancelError(
          error instanceof Error ? error.message : t("cancel.error")
        );
        setCancelling(false);
      });
  }

  const busyPaying = checkout.busy === "pay" || checkout.busy === "recheck";
  const price = checkout.plan
    ? `₹${checkout.plan.amountInr.toLocaleString("en-IN")}`
    : "₹6,999";

  return (
    <OnboardingShell
      activeStep={5}
      title={checkout.isRenewal ? t("renewTitle") : t("title")}
      description={checkout.isRenewal ? t("renewDescription") : t("description")}
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-zinc-950">
            {price}
          </span>
          <span className="text-sm text-zinc-500">{t("perYear")}</span>
        </div>

        <ul className="mt-6 space-y-3 border-t border-zinc-100 pt-6 text-sm text-zinc-700">
          <li className="flex gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#33B573]" />
            {t("oneYear")}
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#33B573]" />
            {t("networkAccess")}
          </li>
          <li className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#33B573]" />
            {t("secure")}
          </li>
        </ul>

        <div className="mt-7 space-y-3">
          {accessError ? (
            <>
              <p role="alert" className="text-sm text-amber-800">
                {accessError}
              </p>
              <Button variant="outline" onClick={retryAccessCheck}>
                {t("retry")}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={
                  checking ||
                  checkout.loading ||
                  !checkout.plan ||
                  checkout.busy !== null ||
                  checkout.awaitingActivation
                }
                aria-busy={busyPaying}
                onClick={() => void checkout.pay()}
              >
                {busyPaying
                  ? t("checkout.opening")
                  : t("checkout.pay", { price })}
              </Button>

              {checkout.awaitingActivation ? (
                <div className="space-y-2">
                  <p role="alert" aria-live="polite" className="text-sm text-amber-800">
                    {t("checkout.processing")}
                  </p>
                  <Button
                    variant="outline"
                    disabled={checkout.busy !== null}
                    onClick={() => void checkout.recheck()}
                  >
                    {t("checkout.recheck")}
                  </Button>
                </div>
              ) : null}

              {checkout.error && !checkout.awaitingActivation ? (
                <p role="alert" aria-live="polite" className="text-sm text-red-700">
                  {checkout.error}
                </p>
              ) : null}

              <p className="text-xs leading-relaxed text-zinc-500">
                {t("checkout.security")}
              </p>
            </>
          )}
        </div>

        {sessionReady && !isAdmin ? (
          <div className="mt-6 border-t border-zinc-100 pt-5">
            <p className="text-sm text-zinc-600">
              {t("signedInAs", { email: user?.email ?? "" })}{" "}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600 disabled:opacity-60"
              >
                {signingOut ? t("signingOut") : t("signOut")}
              </button>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{t("payLaterHint")}</p>

            {confirmingCancel ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-900">{t("cancel.confirm")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelling}
                    onClick={handleCancelSignup}
                  >
                    {cancelling ? t("cancel.working") : t("cancel.confirmCta")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelling}
                    onClick={() => setConfirmingCancel(false)}
                  >
                    {t("cancel.keep")}
                  </Button>
                </div>
                {cancelError ? (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {cancelError}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="mt-3 text-xs font-medium text-zinc-500 underline underline-offset-4 transition-colors hover:text-red-700"
              >
                {t("cancel.cta")}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
