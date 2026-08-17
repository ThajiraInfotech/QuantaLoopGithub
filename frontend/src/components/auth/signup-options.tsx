"use client";

import { useTranslations } from "next-intl";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { GoogleSignupForm } from "@/components/forms/google-signup-form";
import { RegisterForm } from "@/components/forms/register-form";
import { useGoogleSignupPreview } from "@/hooks/use-google-signup-preview";
import { useOnboardingStore } from "@/store/onboarding-store";

export type SignupOptionsProps = {
  context: "onboarding" | "register";
  googleClientId?: string;
};

function SignupOptionsDivider() {
  const t = useTranslations("onboarding.signupOptions");
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-zinc-200" aria-hidden />
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        {t("orEmail")}
      </span>
      <span className="h-px flex-1 bg-zinc-200" aria-hidden />
    </div>
  );
}

export function SignupOptions({ context, googleClientId }: SignupOptionsProps) {
  const t = useTranslations("onboarding.signupOptions");
  const pendingGoogleCredential = useOnboardingStore(
    (s) => s.pendingGoogleCredential
  );
  const { previewGoogleSignup } = useGoogleSignupPreview();

  if (pendingGoogleCredential) {
    return <GoogleSignupForm context={context} />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <GoogleSignInButton
          clientId={googleClientId}
          onSuccess={previewGoogleSignup}
        />
        <p className="text-sm text-zinc-500">{t("googleHint")}</p>
      </div>
      <SignupOptionsDivider />
      <RegisterForm />
    </div>
  );
}
