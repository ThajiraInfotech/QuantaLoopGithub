import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verifyEmail");
  return { title: t("title") };
}

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth.verifyEmail");

  return (
    <AuthCardShell title={t("shellTitle")} description={t("shellDescription")}>
      <VerifyEmailPanel />
    </AuthCardShell>
  );
}
