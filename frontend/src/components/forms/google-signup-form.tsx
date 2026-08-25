"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { LegalConsentCheckbox } from "@/components/legal/legal-consent-checkbox";
import {
  onboardingFieldClass,
  onboardingPrimaryButtonClass,
} from "@/components/onboarding/onboarding-accent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPostAuthRedirect } from "@/lib/auth-routing";
import { flushOnboardingDraftToProfile } from "@/lib/onboarding-flush";
import { isRecommendationOnboardingComplete } from "@/lib/onboarding-readiness";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { ROUTES } from "@/constants/routes";
import { useAccountSetupDraftPersistence } from "@/hooks/use-account-setup-draft";
import { registerWithGoogleRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useProfileTrustStore } from "@/store/profile-trust-store";
import type { SignupRole } from "@/types/user";
import {
  createGoogleAccountSetupSchema,
  type GoogleAccountSetupFormValues,
} from "@/validations/auth";

export type GoogleSignupFormProps = {
  context: "onboarding" | "register";
};

function resolveSignupRole(pendingRole: SignupRole | null): SignupRole {
  return pendingRole ?? "material_provider";
}

export function GoogleSignupForm({ context }: GoogleSignupFormProps) {
  const router = useRouter();
  const t = useTranslations("auth.googleAccountSetup");
  const tRegister = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const setSession = useAuthStore((s) => s.setSession);
  const syncUser = useAuthStore((s) => s.syncUser);
  const setTrustSignals = useProfileTrustStore((s) => s.setTrustSignals);
  const pendingRole = useOnboardingStore((s) => s.pendingSignupRole);
  const pendingSignupEmail = useOnboardingStore((s) => s.pendingSignupEmail);
  const pendingSignupName = useOnboardingStore((s) => s.pendingSignupName);
  const pendingGoogleCredential = useOnboardingStore(
    (s) => s.pendingGoogleCredential
  );
  const clearOnboardingDraft = useOnboardingStore((s) => s.clearOnboardingDraft);
  const clearPendingGoogleProfile = useOnboardingStore(
    (s) => s.clearPendingGoogleProfile
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [legalConsent, setLegalConsent] = useState(false);

  const inOnboardingFlow = context === "onboarding" && pendingRole !== null;
  const requiresLegalConsent = inOnboardingFlow || context === "onboarding";

  const googleAccountSetupSchema = useMemo(
    () =>
      createGoogleAccountSetupSchema({
        email: tValidation("email"),
        passwordRequired: tValidation("passwordRequired"),
        passwordMin: tValidation("passwordMin"),
        passwordMax: tValidation("passwordMax"),
        confirmPassword: tValidation("confirmPassword"),
        passwordsMismatch: tValidation("passwordsMismatch"),
        contactNameRequired: tValidation("contactNameRequired"),
        companyRequired: tValidation("companyRequired"),
      }),
    [tValidation]
  );

  const form = useForm<GoogleAccountSetupFormValues>({
    resolver: zodResolver(googleAccountSetupSchema),
    defaultValues: {
      name: pendingSignupName,
      companyName: "",
      password: "",
      confirmPassword: "",
      role: resolveSignupRole(pendingRole),
    },
  });

  const passwordValue = form.watch("password");

  useAccountSetupDraftPersistence(form, legalConsent, setLegalConsent, {
    includeEmail: false,
    fallbackName: pendingSignupName,
    fallbackEmail: pendingSignupEmail,
  });

  useEffect(() => {
    if (pendingSignupName && !form.getValues("name")) {
      form.setValue("name", pendingSignupName);
    }
  }, [form, pendingSignupName]);

  useEffect(() => {
    if (pendingRole) {
      form.setValue("role", pendingRole);
    }
  }, [form, pendingRole]);

  async function onSubmit(values: GoogleAccountSetupFormValues) {
    setFormError(null);

    if (!pendingGoogleCredential) {
      setFormError(t("setupError"));
      return;
    }

    if (!pendingRole || !isRecommendationOnboardingComplete()) {
      setFormError(tRegister("onboardingIncomplete"));
      if (!pendingRole) router.replace(ROUTES.onboardingRole);
      return;
    }

    try {
      const data = await registerWithGoogleRequest({
        credential: pendingGoogleCredential,
        ...values,
        role: pendingRole,
      });
      setSession({ user: data.user, accessToken: data.accessToken });

      const flushed = await flushOnboardingDraftToProfile();
      if (!flushed) {
        setFormError(tRegister("profileNotSaved"));
        return;
      }
      if (useAuthStore.getState().user?.id === data.user.id) {
        syncUser(flushed.profile);
        setTrustSignals(flushed.trustSignals);
        clearOnboardingDraft();
      }

      clearPendingGoogleProfile();
      const registered = useAuthStore.getState().user ?? data.user;
      router.replace(await getPostAuthRedirect(registered));
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("setupError"));
    }
  }

  if (!pendingGoogleCredential || !pendingSignupEmail) {
    return null;
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t("accountLabel")}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-900">
          {pendingSignupEmail}
        </p>
        <p className="mt-1 text-sm text-zinc-600">{t("linkedHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="google-signup-name">{t("contactName")}</Label>
          <Input
            id="google-signup-name"
            autoComplete="name"
            className={onboardingFieldClass}
            {...form.register("name")}
          />
          {form.formState.errors.name?.message ? (
            <p className="text-sm text-red-600" role="alert">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="google-signup-company">{t("companyName")}</Label>
          <Input
            id="google-signup-company"
            autoComplete="organization"
            className={onboardingFieldClass}
            {...form.register("companyName")}
          />
          {form.formState.errors.companyName?.message ? (
            <p className="text-sm text-red-600" role="alert">
              {form.formState.errors.companyName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {t("passwordSection")}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">{t("passwordHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-signup-password">{t("password")}</Label>
            <PasswordInput
              id="google-signup-password"
              autoComplete="new-password"
              inputClassName={onboardingFieldClass}
              {...form.register("password")}
            />
            <PasswordStrengthMeter password={passwordValue} />
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-red-600" role="alert">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-signup-confirm">{t("confirmPassword")}</Label>
            <PasswordInput
              id="google-signup-confirm"
              autoComplete="new-password"
              inputClassName={onboardingFieldClass}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword?.message ? (
              <p className="text-sm text-red-600" role="alert">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <input type="hidden" {...form.register("role")} />

      {formError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      {requiresLegalConsent ? (
        <LegalConsentCheckbox
          checked={legalConsent}
          onCheckedChange={setLegalConsent}
        />
      ) : null}

      <Button
        type="submit"
        variant="accent"
        className={cn(
          "h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-10 sm:py-2",
          onboardingPrimaryButtonClass
        )}
        disabled={
          form.formState.isSubmitting || (requiresLegalConsent && !legalConsent)
        }
      >
        {form.formState.isSubmitting ? t("saving") : t("complete")}
      </Button>

      <p className="text-center text-sm text-zinc-600">
        <button
          type="button"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
          onClick={() => clearPendingGoogleProfile()}
        >
          {t("useEmailInstead")}
        </button>
        {context === "register" ? (
          <>
            {" · "}
            <Link
              href={ROUTES.login}
              className="font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              {tCommon("signIn")}
            </Link>
          </>
        ) : null}
      </p>
    </form>
  );
}
