import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LandingFooter } from "@/components/landing/landing-footer";
import { Logo } from "@/components/shared/logo";
import { ContactSupportForm } from "@/components/support/contact-support-form";
import { LegalBackLink } from "@/components/legal/legal-back-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("support");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("support");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <LegalBackLink />
        </div>
      </header>
      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-eyebrow text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-body leading-relaxed text-muted-foreground">
            {t("pageDescription")}
          </p>
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-5 shadow-subtle sm:p-8">
            <ContactSupportForm source="public" />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
