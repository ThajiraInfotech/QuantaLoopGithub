"use client";

import { SignupOptions } from "@/components/auth/signup-options";

type AccountSetupSignupOptionsProps = {
  googleClientId?: string;
};

export function AccountSetupSignupOptions({
  googleClientId,
}: AccountSetupSignupOptionsProps) {
  return (
    <SignupOptions context="onboarding" googleClientId={googleClientId} />
  );
}
