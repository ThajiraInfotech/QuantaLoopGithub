"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CtaLink } from "@/components/landing/cta-link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { ContactSupportModal } from "@/components/support/contact-support-modal";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const navLinkKeys = [
  { key: "howItWorks", href: "#how-it-works" },
  { key: "whoItsFor", href: "#network" },
  { key: "whyQuantaLoop", href: "#why-quanta-loop" },
  { key: "pricing", href: "#access" },
] as const;

const sectionIds = navLinkKeys.map((link) => link.href.slice(1));

const actionText =
  "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200";

function NavAnchor({
  href,
  label,
  isActive,
  onClick,
  className,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "location" : undefined}
      className={cn(
        "group relative inline-flex h-9 items-center px-3 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-3 -bottom-px h-px rounded-full bg-foreground/70 transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        )}
      />
    </Link>
  );
}

export function LandingNavbar() {
  const t = useTranslations("landing.nav");
  const tCommon = useTranslations("common");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const navLinks = useMemo(
    () =>
      navLinkKeys.map((item) => ({
        href: item.href,
        label: t(item.key),
      })),
    [t]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  function openSupport() {
    closeMobile();
    setSupportOpen(true);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-[border-color,background-color,box-shadow] duration-300",
          scrolled || mobileOpen
            ? "border-border/70 bg-background/95 shadow-[0_8px_24px_-18px_rgba(15,20,22,0.35)] backdrop-blur-xl"
            : "border-transparent bg-background/75 backdrop-blur-md"
        )}
      >
        {/* Desktop: links left · logo center · actions right */}
        <div className="mx-auto hidden h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6 lg:grid lg:px-8">
          <nav
            className="flex min-w-0 items-center justify-start gap-0.5"
            aria-label="Primary"
          >
            {navLinks.map((item) => (
              <NavAnchor
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={activeSection === item.href.slice(1)}
              />
            ))}
          </nav>

          <div className="justify-self-center">
            <Logo className="h-9" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher compact variant="nav" />
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className={cn(
                  actionText,
                  "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                {t("contact")}
              </button>
            </div>
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            <div className="flex items-center gap-2">
              <CtaLink
                href={ROUTES.login}
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-border/90 bg-transparent px-4 text-[13px] font-medium shadow-none hover:bg-muted/80"
              >
                {tCommon("signIn")}
              </CtaLink>
              <CtaLink
                href={ROUTES.onboardingRole}
                variant="primary"
                size="sm"
                className="h-9 rounded-full px-4 text-[13px] font-semibold shadow-none"
              >
                {tCommon("getStarted")}
              </CtaLink>
            </div>
          </div>
        </div>

        {/* Mobile / tablet bar — unchanged pattern */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:hidden">
          <Logo className="h-8 shrink-0 sm:h-9" />
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-0.5 sm:flex">
              <LanguageSwitcher compact variant="nav" />
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className={cn(
                  actionText,
                  "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                )}
              >
                {t("contact")}
              </button>
            </div>
            <span
              className="mx-1 hidden h-4 w-px bg-border sm:block"
              aria-hidden
            />
            <div className="hidden items-center gap-2 sm:flex">
              <CtaLink
                href={ROUTES.login}
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-border/90 bg-transparent px-4 text-[13px] font-medium shadow-none hover:bg-muted/80"
              >
                {tCommon("signIn")}
              </CtaLink>
              <CtaLink
                href={ROUTES.onboardingRole}
                variant="primary"
                size="sm"
                className="h-9 rounded-full px-4 text-[13px] font-semibold shadow-none"
              >
                {tCommon("getStarted")}
              </CtaLink>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 rounded-full p-0"
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-nav"
              aria-label={
                mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")
              }
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <nav
          id="landing-mobile-nav"
          className={cn(
            "border-t transition-[max-height,opacity,border-color] duration-300 ease-out lg:hidden",
            mobileOpen
              ? "max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto overscroll-contain border-border/70 bg-background/96 opacity-100 backdrop-blur-xl"
              : "max-h-0 overflow-hidden border-transparent opacity-0"
          )}
          aria-label="Mobile"
          aria-hidden={!mobileOpen}
        >
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mb-4 sm:hidden">
              <LanguageSwitcher compact variant="nav" />
            </div>

            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <NavAnchor
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={activeSection === item.href.slice(1)}
                  onClick={closeMobile}
                  className="h-11 w-full justify-start px-4 text-base"
                />
              ))}
              <button
                type="button"
                onClick={openSupport}
                className="inline-flex h-11 w-full items-center justify-start rounded-xl px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                {t("contact")}
              </button>
            </div>

            <div className="mt-5 grid gap-2 border-t border-border/70 pt-5 sm:grid-cols-2">
              <CtaLink
                href={ROUTES.login}
                variant="outline"
                size="md"
                className="h-11 rounded-full text-sm font-medium"
                onClick={closeMobile}
              >
                {tCommon("signIn")}
              </CtaLink>
              <CtaLink
                href={ROUTES.onboardingRole}
                variant="primary"
                size="md"
                className="h-11 rounded-full text-sm font-semibold sm:col-span-1"
                onClick={closeMobile}
              >
                {tCommon("getStarted")}
              </CtaLink>
            </div>
          </div>
        </nav>
      </header>

      <ContactSupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        source="public"
      />
    </>
  );
}
