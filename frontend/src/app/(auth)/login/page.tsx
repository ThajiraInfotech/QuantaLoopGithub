import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { GoogleOAuthProviderShell } from "@/components/auth/google-oauth-provider";
import { LoginForm } from "@/components/forms/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("signIn") };
}

export default async function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const t = await getTranslations("auth.login");

  return (
    <GoogleOAuthProviderShell clientId={googleClientId}>
      <AuthCardShell title={t("title")} description={t("description")}>
        <LoginForm googleClientId={googleClientId} />
      </AuthCardShell>
    </GoogleOAuthProviderShell>
  );
}
