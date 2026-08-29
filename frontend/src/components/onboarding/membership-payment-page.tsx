"use client";

import { CalendarDays, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  MembershipBillingForm,
  emptyBillingForm,
  type BillingFormValues,
} from "@/components/onboarding/membership-billing-form";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { onboardingPrimaryButtonClass } from "@/components/onboarding/onboarding-accent";
import { Button } from "@/components/ui/button";
import { getStateByCode } from "@/constants/indian-locations";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useInterceptBrowserBack } from "@/hooks/use-intercept-browser-back";
import { useMembershipCheckout } from "@/hooks/use-membership-checkout";
import { userNeedsAccountSetup } from "@/lib/auth-routing";
import {
  cancelSignupRequest,
  logoutRequest,
} from "@/services/auth/auth.service";
import {
  getBillingProfile,
  getTaxPreview,
  saveBillingProfile,
} from "@/services/billing/billing.service";
import { getSubscriptionAccessState } from "@/services/subscriptions/subscription.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { BillingProfile, TaxPreview } from "@/types/billing";
import {
  formatMembershipPrice,
  membershipPriceForCountry,
} from "@/lib/membership-pricing";
import { INDIA_COUNTRY_CODE } from "@/constants/countries";

function accountCountryCode(userCountry?: string | null): string {
  return String(userCountry || INDIA_COUNTRY_CODE)
    .trim()
    .toUpperCase() || INDIA_COUNTRY_CODE;
}

/** Prefer complete billing profile country; otherwise onboarding/account country. */
function resolveBillingCountry(
  profile: BillingProfile | null | undefined,
  userCountry?: string | null
): string {
  const account = accountCountryCode(userCountry);
  const fromProfile = profile?.address?.country?.trim().toUpperCase();
  const profileLooksSaved = Boolean(
    profile?.legalName?.trim() && profile?.address?.line1?.trim()
  );
  if (profileLooksSaved && fromProfile) return fromProfile;
  return account;
}

function validateBillingForm(values: BillingFormValues): string | null {
  if (!values.legalName.trim()) return "Enter the billing / legal name.";
  if (!values.line1.trim()) return "Enter the billing address.";
  if (!values.city.trim()) return "Enter the billing city.";
  if (!values.pincode.trim()) return "Enter the billing PIN / postal code.";
  if (values.country === "IN") {
    if (!values.stateCode.trim()) return "Select the billing state.";
    if (values.gstRegistered) {
      const gstin = values.gstin.trim().toUpperCase();
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          gstin
        )
      ) {
        return "Enter a valid 15-character GSTIN.";
      }
    }
  }
  return null;
}

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
  const [showActivationRecheck, setShowActivationRecheck] = useState(false);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(
    null
  );
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingCountry, setBillingCountry] = useState(() =>
    accountCountryCode(user?.country)
  );
  const billingValuesRef = useRef<BillingFormValues | null>(null);
  const isAdmin = user?.role === "admin";
  const sessionReady = authHydrated && Boolean(accessToken && user);

  // Onboarding already captured India vs abroad — keep paywall in sync.
  useEffect(() => {
    if (!user?.country) return;
    setBillingCountry((prev) => {
      const account = accountCountryCode(user.country);
      // Don't override a country the user just picked in the billing form.
      if (billingValuesRef.current?.country) {
        return accountCountryCode(billingValuesRef.current.country);
      }
      return prev === account ? prev : account;
    });
  }, [user?.country]);

  const enterNetwork = useCallback(() => {
    router.replace(ROUTES.dashboard);
    router.refresh();
  }, [router]);

  const billingDefaults = {
    legalName: user?.companyName || user?.name || "",
    email: user?.email || "",
    country: resolveBillingCountry(billingProfile, user?.country),
    stateCode: user?.stateCode || "",
    state: user?.state || "",
    city: user?.city || user?.location || "",
  };

  const handleBillingChange = useCallback((values: BillingFormValues) => {
    billingValuesRef.current = values;
    const nextCountry = (values.country || "IN").toUpperCase();
    setBillingCountry((prev) => (prev === nextCountry ? prev : nextCountry));
  }, []);

  const refreshTaxPreview = useCallback(
    async (values: BillingFormValues) => {
      setBillingCountry((values.country || "IN").toUpperCase());
      const localError = validateBillingForm(values);
      if (localError) {
        // Incomplete address: still show country currency, don't keep a stale INR quote.
        setTaxPreview(null);
        return;
      }
      try {
        const stateName =
          values.state || getStateByCode(values.stateCode)?.name || "";
        const saved = await saveBillingProfile({
          legalName: values.legalName.trim(),
          billingEmail: user?.email || "",
          customerType: values.customerType,
          gstRegistered: values.country === "IN" ? values.gstRegistered : false,
          gstin: values.gstRegistered ? values.gstin.trim().toUpperCase() : "",
          taxId: values.country === "IN" ? "" : values.taxId.trim(),
          address: {
            line1: values.line1.trim(),
            line2: values.line2.trim(),
            city: values.city.trim(),
            state: stateName,
            stateCode: values.stateCode.trim().toUpperCase(),
            pincode: values.pincode.trim(),
            country: values.country.trim().toUpperCase(),
          },
        });
        setBillingProfile(saved.profile);
        setTaxPreview(saved.taxPreview);
        setBillingError(null);
      } catch {
        /* preview is best-effort until pay */
      }
    },
    [user?.email]
  );

  const saveBillingBeforePay = useCallback(async () => {
    const values =
      billingValuesRef.current || emptyBillingForm(billingDefaults);
    const localError = validateBillingForm(values);
    if (localError) {
      setBillingError(localError);
      throw new Error(localError);
    }
    setBillingError(null);
    const stateName =
      values.state ||
      getStateByCode(values.stateCode)?.name ||
      "";
    const saved = await saveBillingProfile({
      legalName: values.legalName.trim(),
      billingEmail: user?.email || "",
      customerType: values.customerType,
      gstRegistered: values.country === "IN" ? values.gstRegistered : false,
      gstin: values.gstRegistered ? values.gstin.trim().toUpperCase() : "",
      taxId: values.country === "IN" ? "" : values.taxId.trim(),
      address: {
        line1: values.line1.trim(),
        line2: values.line2.trim(),
        city: values.city.trim(),
        state: stateName,
        stateCode: values.stateCode.trim().toUpperCase(),
        pincode: values.pincode.trim(),
        country: values.country.trim().toUpperCase(),
      },
    });
    setBillingProfile(saved.profile);
    setTaxPreview(saved.taxPreview);
    setBillingCountry(
      (saved.profile.address?.country || values.country || "IN").toUpperCase()
    );
  }, [
    billingDefaults.city,
    billingDefaults.country,
    billingDefaults.legalName,
    billingDefaults.state,
    billingDefaults.stateCode,
    user?.email,
  ]);

  const getExpectedCurrency = useCallback(() => {
    const formCountry =
      billingValuesRef.current?.country || billingCountry || user?.country;
    return membershipPriceForCountry(formCountry).currency;
  }, [billingCountry, user?.country]);

  // Loaded alongside the access check so the pay button is live immediately.
  const checkout = useMembershipCheckout({
    enabled: sessionReady && !isAdmin,
    onEntitled: enterNetwork,
    beforePay: saveBillingBeforePay,
    getExpectedCurrency,
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

  useEffect(() => {
    if (!sessionReady || isAdmin) {
      setBillingLoading(false);
      return;
    }
    let cancelled = false;
    setBillingLoading(true);
    getBillingProfile()
      .then(async (profile) => {
        if (cancelled) return;
        setBillingProfile(profile);
        setBillingCountry(resolveBillingCountry(profile, user?.country));
        if (profile) {
          try {
            const preview = await getTaxPreview("annual_access");
            if (!cancelled) {
              const expected = membershipPriceForCountry(
                resolveBillingCountry(profile, user?.country)
              );
              // Ignore a stale INR quote when the account is abroad (and vice versa).
              if (
                preview &&
                String(preview.currency || "").toUpperCase() ===
                  expected.currency
              ) {
                setTaxPreview(preview);
              } else {
                setTaxPreview(null);
              }
            }
          } catch {
            /* incomplete profile is fine */
          }
        }
      })
      .catch(() => {
        /* first-time payers may have no profile yet */
      })
      .finally(() => {
        if (!cancelled) setBillingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, sessionReady, user?.country]);

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
  const price = (() => {
    const expected = membershipPriceForCountry(
      billingCountry || user?.country
    );
    if (
      taxPreview &&
      String(taxPreview.currency || "").toUpperCase() === expected.currency
    ) {
      return formatMembershipPrice(
        taxPreview.amountInclusive,
        taxPreview.currency
      );
    }
    return formatMembershipPrice(expected.amount, expected.currency);
  })();
  const canStartOver =
    sessionReady &&
    !isAdmin &&
    !checkout.loading &&
    !checkout.isRenewal &&
    !checkout.awaitingActivation &&
    checkout.busy === null;

  useInterceptBrowserBack(canStartOver, () => {
    setConfirmingCancel(true);
  });

  useEffect(() => {
    if (!checkout.awaitingActivation) {
      setShowActivationRecheck(false);
      return;
    }
    const timeoutId = window.setTimeout(() => setShowActivationRecheck(true), 10_000);
    return () => window.clearTimeout(timeoutId);
  }, [checkout.awaitingActivation]);

  return (
    <OnboardingShell
      activeStep={5}
      title={checkout.isRenewal ? t("renewTitle") : t("title")}
      description={checkout.isRenewal ? t("renewDescription") : t("description")}
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-8">
        {confirmingCancel && canStartOver ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
            <p className="text-sm leading-relaxed text-pretty text-red-900">
              {t("cancel.confirm")}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="destructive"
                size="sm"
                className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-9 sm:w-auto sm:py-0"
                disabled={cancelling}
                onClick={handleCancelSignup}
              >
                {cancelling ? t("cancel.working") : t("cancel.confirmCta")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-9 sm:w-auto sm:py-0"
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
        ) : canStartOver ? (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            disabled={cancelling}
            className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline disabled:opacity-60 sm:min-h-0"
          >
            {t("startOver")}
          </button>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[2rem] font-semibold leading-none tracking-tight text-zinc-950 sm:text-4xl">
            {price}
          </span>
          <span className="text-sm text-zinc-500">{t("perYear")}</span>
        </div>

        <ul className="mt-5 space-y-3 border-t border-zinc-100 pt-5 text-sm leading-relaxed text-zinc-700 sm:mt-6 sm:pt-6">
          <li className="flex gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#33B573] sm:h-4 sm:w-4" />
            <span className="min-w-0 text-pretty">{t("oneYear")}</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#33B573] sm:h-4 sm:w-4" />
            <span className="min-w-0 text-pretty">{t("networkAccess")}</span>
          </li>
          <li className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#33B573] sm:h-4 sm:w-4" />
            <span className="min-w-0 text-pretty">{t("secure")}</span>
          </li>
        </ul>

        {!accessError && !checkout.awaitingActivation && sessionReady && !isAdmin ? (
          <div className="mt-6">
            {billingLoading ? (
              <p className="text-sm text-zinc-500">{t("billing.loading")}</p>
            ) : (
              <MembershipBillingForm
                initialProfile={billingProfile}
                defaults={billingDefaults}
                taxPreview={taxPreview}
                disabled={busyPaying}
                error={billingError}
                onChange={handleBillingChange}
                onTaxRelevantChange={(values) => {
                  billingValuesRef.current = values;
                  void refreshTaxPreview(values);
                }}
              />
            )}
          </div>
        ) : null}

        <div className="mt-6 space-y-3 sm:mt-7">
          {accessError ? (
            <>
              <p role="alert" className="text-sm leading-relaxed text-pretty text-amber-800">
                {accessError}
              </p>
              <Button
                variant="outline"
                className="h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-10 sm:w-auto sm:py-2"
                onClick={retryAccessCheck}
              >
                {t("retry")}
              </Button>
            </>
          ) : (
            <>
              {checkout.awaitingActivation ? (
                <div className="rounded-xl border border-[#B5E8D0] bg-[#DFF5EA] px-4 py-5">
                  <div className="flex items-start gap-3">
                    <Loader2
                      className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#33B573]"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-900">
                        {checkout.error
                          ? t("checkout.processing")
                          : t("checkout.paidTitle")}
                      </p>
                      <p
                        role="status"
                        aria-live="polite"
                        className="mt-1 text-sm leading-relaxed text-pretty text-zinc-600"
                      >
                        {t("checkout.activating")}
                      </p>
                    </div>
                  </div>
                  {checkout.error ? (
                    <p role="alert" className="mt-3 text-sm leading-relaxed text-pretty text-red-700">
                      {checkout.error}
                    </p>
                  ) : null}
                  {showActivationRecheck ? (
                    <Button
                      variant="outline"
                      className="mt-4 h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-10 sm:w-auto sm:py-2"
                      disabled={checkout.busy !== null}
                      onClick={() => void checkout.recheck()}
                    >
                      {t("checkout.recheck")}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Button
                  size="lg"
                  variant="accent"
                  className={cn(
                    "h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-base sm:h-11 sm:min-h-11 sm:w-auto sm:py-2 sm:text-body",
                    onboardingPrimaryButtonClass
                  )}
                  disabled={
                    checking ||
                    checkout.loading ||
                    billingLoading ||
                    !checkout.plan ||
                    checkout.busy !== null
                  }
                  aria-busy={busyPaying}
                  onClick={() => void checkout.pay()}
                >
                  {busyPaying
                    ? t("checkout.opening")
                    : t("checkout.pay", { price })}
                </Button>
              )}

              {checkout.error && !checkout.awaitingActivation ? (
                <p role="alert" aria-live="polite" className="text-sm leading-relaxed text-pretty text-red-700">
                  {checkout.error}
                </p>
              ) : null}

              {checkout.awaitingActivation ? null : (
                <p className="text-xs leading-relaxed text-pretty text-zinc-500">
                  {t("checkout.security")}
                </p>
              )}
            </>
          )}
        </div>

        {sessionReady && !isAdmin ? (
          <div className="mt-6 border-t border-zinc-100 pt-5">
            <p className="text-sm leading-relaxed text-zinc-600">
              <span className="break-all">
                {t("signedInAs", { email: user?.email ?? "" })}
              </span>{" "}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex min-h-11 items-center font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600 disabled:opacity-60 sm:min-h-0"
              >
                {signingOut ? t("signingOut") : t("signOut")}
              </button>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-pretty text-zinc-500 sm:mt-1">
              {t("payLaterHint")}
            </p>

            {canStartOver && !confirmingCancel ? (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="mt-3 inline-flex min-h-11 items-center text-left text-xs font-medium text-zinc-500 underline underline-offset-4 transition-colors hover:text-red-700 sm:min-h-0"
              >
                {t("cancel.cta")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
