import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verifyEmail");
  return { title: t("title") };
}

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth.verifyEmail");

  return (
    <VerifyEmailScreen
      title={t("shellTitle")}
      description={t("shellDescription")}
    >
      <VerifyEmailPanel />
    </VerifyEmailScreen>
  );
}
