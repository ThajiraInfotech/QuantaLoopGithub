import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import { EarthGlobeIcon } from "@/components/shared/earth-globe-icon";
import { IndiaMapIcon } from "@/components/shared/india-map-icon";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function FooterLinkColumn({
  title,
  links,
  ariaLabel,
}: {
  title: string;
  links: FooterLink[];
  ariaLabel: string;
}) {
  return (
    <nav className="flex min-w-[128px] flex-col gap-2" aria-label={ariaLabel}>
      <p className="text-eyebrow">{title}</p>
      {links.map((item) =>
        item.external ? (
          <a
            key={item.label}
            href={item.href}
            className="text-small font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className="text-small font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");
  const tNav = await getTranslations("landing.nav");
  const tCommon = await getTranslations("common");
  const year = new Date().getFullYear();
  const fromToPrefix = t("fromToPrefix");
  const fromToSuffix = t("fromToSuffix");

  const navigationLinks: FooterLink[] = [
    { label: tNav("howItWorks"), href: "#how-it-works" },
    { label: tNav("whoItsFor"), href: "#network" },
    { label: tNav("whyQuantaLoop"), href: "#why-quanta-loop" },
    { label: tNav("pricing"), href: "#access" },
    { label: tCommon("signIn"), href: ROUTES.login },
  ];

  const companyLinks: FooterLink[] = [
    {
      label: t("contact"),
      href: "mailto:access@quantaloop.com?subject=Quanta%20Loop%20Inquiry",
      external: true,
    },
    { label: t("terms"), href: ROUTES.legalTerms },
    { label: t("privacy"), href: ROUTES.legalPrivacy },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1200px] px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
        <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[460px] shrink-0 text-left">
            <Logo withLink={false} className="h-10" />
            <p className="mt-3 text-small leading-relaxed text-muted-foreground">
              {t("description1")}
            </p>
            <p className="mt-2 text-small leading-relaxed text-muted-foreground">
              {t("description2")}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-start gap-6 sm:gap-8 md:gap-10">
            <FooterLinkColumn
              title={t("navigation")}
              links={navigationLinks}
              ariaLabel="Footer navigation"
            />
            <nav
              className="flex min-w-[128px] flex-col gap-2"
              aria-label="Footer company"
            >
              <p className="text-eyebrow">{t("company")}</p>
              {companyLinks.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-small font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-small font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="mt-4 border-t border-border/80 pt-4">
                <p className="text-small font-medium text-foreground">
                  {t("readyToJoin")}
                </p>
                <CtaLink
                  href={ROUTES.onboardingRole}
                  variant="link"
                  className="mt-1.5 inline-flex h-auto items-center p-0 text-small font-semibold text-accent whitespace-nowrap transition-[color,transform] duration-200 ease-out hover:translate-x-1 hover:text-[#228a58]"
                >
                  {t("startTrial")}
                </CtaLink>
              </div>
            </nav>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-caption leading-relaxed text-muted-foreground">
            © {year} Quanta Loop{" "}
            <span className="text-muted-foreground/45" aria-hidden>
              •
            </span>{" "}
            {t("copyright1")}{" "}
            <span className="text-muted-foreground/45" aria-hidden>
              •
            </span>{" "}
            {t("copyright2")}{" "}
            <span className="text-muted-foreground/45" aria-hidden>
              •
            </span>{" "}
            {t("copyright3")}
          </p>

          <p
            className="inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-border bg-muted/40 px-5 py-2.5 font-heading text-body font-semibold tracking-tight text-foreground sm:self-auto"
            aria-label={t("fromToAria")}
          >
            {fromToPrefix ? <span>{fromToPrefix}</span> : null}
            <span className="inline-flex text-accent" title={t("indiaIconLabel")}>
              <IndiaMapIcon className="h-8 w-8" />
              <span className="sr-only">{t("indiaIconLabel")}</span>
            </span>
            <span className="text-muted-foreground">{t("fromToConnector")}</span>
            <span className="inline-flex text-accent" title={t("worldIconLabel")}>
              <EarthGlobeIcon className="h-8 w-8" />
              <span className="sr-only">{t("worldIconLabel")}</span>
            </span>
            {fromToSuffix ? <span>{fromToSuffix}</span> : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
