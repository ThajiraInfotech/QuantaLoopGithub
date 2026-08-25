"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { LegalConsentCheckbox } from "@/components/legal/legal-consent-checkbox";
import {
  onboardingFieldClass,
  onboardingPrimaryButtonClass,
} from "@/components/onboarding/onboarding-accent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { flushOnboardingDraftToProfile } from "@/lib/onboarding-flush";
import { isRecommendationOnboardingComplete } from "@/lib/onboarding-readiness";
import { getPostAuthRedirect, userNeedsEmailOtp } from "@/lib/auth-routing";
import {
  locationDraftToPatch,
  isLocationDraftComplete,
} from "@/lib/location-profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { ROUTES } from "@/constants/routes";
import { useAccountSetupDraftPersistence } from "@/hooks/use-account-setup-draft";
import { registerRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import {
  normalizeLocationDraft,
  useOnboardingStore,
} from "@/store/onboarding-store";
import { useProfileTrustStore } from "@/store/profile-trust-store";
import {
  createRegisterSchema,
  type RegisterFormValues,
  type RegisterRequestBody,
} from "@/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const setSession = useAuthStore((s) => s.setSession);
  const syncUser = useAuthStore((s) => s.syncUser);
  const setTrustSignals = useProfileTrustStore((s) => s.setTrustSignals);
  const pendingRole = useOnboardingStore((s) => s.pendingSignupRole);
  const pendingSignupEmail = useOnboardingStore((s) => s.pendingSignupEmail);
  const clearOnboardingDraft = useOnboardingStore((s) => s.clearOnboardingDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [legalConsent, setLegalConsent] = useState(false);
  const requiresLegalConsent = pendingRole !== null;

  const registerSchema = useMemo(
    () =>
      createRegisterSchema({
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: pendingRole ?? "material_provider",
    },
  });

  const passwordValue = form.watch("password");

  useAccountSetupDraftPersistence(form, legalConsent, setLegalConsent, {
    fallbackEmail: pendingSignupEmail,
  });

  useEffect(() => {
    if (pendingRole) {
      form.setValue("role", pendingRole);
    }
  }, [form, pendingRole]);

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    if (!pendingRole || !isRecommendationOnboardingComplete()) {
      setFormError(t("onboardingIncomplete"));
      if (!pendingRole) router.replace(ROUTES.onboardingRole);
      return;
    }
    try {
      const { confirmPassword: _confirm, ...registerBody } = values;
      const inOnboardingFlow = true;

      // Persist location on the user at create-time so OTP races cannot wipe it.
      const locationDraft = normalizeLocationDraft(
        useOnboardingStore.getState().draftLocation
      );
      const draftMaterials = useOnboardingStore.getState().draftMaterials;
      const locationFields: Partial<RegisterRequestBody> = {};
      if (inOnboardingFlow && isLocationDraftComplete(locationDraft)) {
        const patch = locationDraftToPatch(locationDraft);
        locationFields.country = patch.country;
        locationFields.state = patch.state;
        locationFields.stateCode = patch.stateCode;
        locationFields.city = patch.city;
        locationFields.location = patch.location;
      }

      const materialFields: Partial<RegisterRequestBody> = {};
      if (inOnboardingFlow && draftMaterials.length > 0) {
        materialFields.materialTypes = draftMaterials;
        if (pendingRole === "verified_buyer") {
          materialFields.requiredMaterialCategories = draftMaterials;
        } else {
          materialFields.preferredMaterialCategories = draftMaterials;
        }
      }

      const data = await registerRequest({
        ...registerBody,
        ...locationFields,
        ...materialFields,
        role: pendingRole ?? values.role,
      });
      setSession({ user: data.user, accessToken: data.accessToken });

      const needsOtp =
        userNeedsEmailOtp(data.user) || Boolean(data.needsEmailVerification);

      // Open OTP immediately — do not wait on profile flush (location/materials
      // were already sent in the register payload).
      if (needsOtp) {
        router.replace(ROUTES.verifyEmail);
        router.refresh();

        void (async () => {
          const registeredUserId = data.user.id;
          try {
            const flushed = await flushOnboardingDraftToProfile();
            if (useAuthStore.getState().user?.id !== registeredUserId) return;
            if (flushed) {
              syncUser({
                ...flushed.profile,
                emailVerified: data.user.emailVerified,
                authProvider: data.user.authProvider,
                googleEmailVerified: data.user.googleEmailVerified,
              });
              setTrustSignals(flushed.trustSignals);
              clearOnboardingDraft();
            }
          } catch {
            /* verify-email panel also retries flush after OTP */
          }
        })();
        return;
      }

      try {
        const flushed = await flushOnboardingDraftToProfile();
        if (flushed) {
          syncUser({
            ...flushed.profile,
            emailVerified: data.user.emailVerified,
            authProvider: data.user.authProvider,
            googleEmailVerified: data.user.googleEmailVerified,
          });
          setTrustSignals(flushed.trustSignals);
        } else if (inOnboardingFlow) {
          setFormError(t("profileNotSaved"));
          return;
        }
      } catch {
        if (inOnboardingFlow) {
          setFormError(t("profileNotSaved"));
          return;
        }
      }

      clearOnboardingDraft();

      // The account now exists, so membership is the only step that can remain.
      const registered = useAuthStore.getState().user ?? data.user;
      router.replace(await getPostAuthRedirect(registered));
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("registerFailed"));
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">{tCommon("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={onboardingFieldClass}
            {...form.register("email")}
          />
          <p className="text-sm text-zinc-500">{t("emailHint")}</p>
          {form.formState.errors.email?.message ? (
            <p className="text-sm text-red-600" role="alert">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="password">{tCommon("password")}</Label>
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

        <div className="space-y-2 sm:col-span-2">
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

      <input type="hidden" {...form.register("role")} />

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
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
          form.formState.isSubmitting ||
          (requiresLegalConsent && !legalConsent)
        }
      >
        {form.formState.isSubmitting ? t("creatingAccount") : t("createAccount")}
      </Button>

      <p className="text-center text-sm text-zinc-600">
        {t("alreadyHaveAccess")}{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          {tCommon("signIn")}
        </Link>
      </p>
    </form>
  );
}
