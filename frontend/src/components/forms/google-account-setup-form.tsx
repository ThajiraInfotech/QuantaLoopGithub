"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { getPostAuthRedirect } from "@/lib/auth-routing";
import { cn } from "@/lib/utils";
import { useAccountSetupDraftPersistence } from "@/hooks/use-account-setup-draft";
import { completeAccountSetupRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { SignupRole } from "@/types/user";
import {
  createGoogleAccountSetupSchema,
  type GoogleAccountSetupFormValues,
} from "@/validations/auth";

function resolveSignupRole(
  pendingRole: SignupRole | null,
  userRole: string | undefined
): SignupRole {
  if (pendingRole) return pendingRole;
  if (userRole === "verified_buyer" || userRole === "material_provider") {
    return userRole;
  }
  return "material_provider";
}

export function GoogleAccountSetupForm() {
  const router = useRouter();
  const t = useTranslations("auth.googleAccountSetup");
  const tValidation = useTranslations("validation");
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const pendingRole = useOnboardingStore((s) => s.pendingSignupRole);
  const clearOnboardingDraft = useOnboardingStore((s) => s.clearOnboardingDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [legalConsent, setLegalConsent] = useState(false);

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
      name: user?.name ?? "",
      companyName: user?.companyName ?? "",
      password: "",
      confirmPassword: "",
      role: resolveSignupRole(pendingRole, user?.role),
    },
  });

  const passwordValue = form.watch("password");

  useAccountSetupDraftPersistence(form, legalConsent, setLegalConsent, {
    includeEmail: false,
    fallbackName: user?.name ?? "",
    fallbackCompanyName: user?.companyName ?? "",
  });

  useEffect(() => {
    if (user?.name && !form.getValues("name")) {
      form.setValue("name", user.name);
    }
    if (user?.companyName && !form.getValues("companyName")) {
      form.setValue("companyName", user.companyName);
    }
  }, [form, user?.name, user?.companyName]);

  useEffect(() => {
    if (pendingRole) {
      form.setValue("role", pendingRole);
    }
  }, [form, pendingRole]);

  async function onSubmit(values: GoogleAccountSetupFormValues) {
    setFormError(null);
    try {
      const data = await completeAccountSetupRequest({
        ...values,
        role: pendingRole ?? values.role,
      });
      setSession({ user: data.user, accessToken: data.accessToken });
      clearOnboardingDraft();
      router.replace(await getPostAuthRedirect(data.user));
      router.refresh();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : t("setupError")
      );
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {user?.email ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("accountLabel")}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{user.email}</p>
          <p className="mt-1 text-sm text-zinc-600">{t("linkedHint")}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">{t("contactName")}</Label>
          <Input
            id="name"
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
          <Label htmlFor="companyName">{t("companyName")}</Label>
          <Input
            id="companyName"
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
            <p className="text-sm font-medium text-zinc-900">{t("passwordSection")}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{t("passwordHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput
              id="password"
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
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <PasswordInput
              id="confirmPassword"
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

      <LegalConsentCheckbox
        checked={legalConsent}
        onCheckedChange={setLegalConsent}
      />

      <Button
        type="submit"
        variant="accent"
        className={cn(
          "h-auto min-h-11 w-full whitespace-normal py-2.5 sm:h-10 sm:py-2",
          onboardingPrimaryButtonClass
        )}
        disabled={form.formState.isSubmitting || !legalConsent}
      >
        {form.formState.isSubmitting ? t("saving") : t("complete")}
      </Button>
    </form>
  );
}
