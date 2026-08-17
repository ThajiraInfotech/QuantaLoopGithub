import { GoogleOAuthProviderShell } from "@/components/auth/google-oauth-provider";
import { AccountSetupPage } from "@/components/onboarding/account-setup-page";

export default function OnboardingAccountPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProviderShell clientId={googleClientId}>
      <AccountSetupPage googleClientId={googleClientId} />
    </GoogleOAuthProviderShell>
  );
}
