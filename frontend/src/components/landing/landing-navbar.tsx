"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CtaLink } from "@/components/landing/cta-link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const navLinkKeys = [
  { key: "smartMatching", href: "#recommendations" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "whoItsFor", href: "#network" },
  { key: "whyQuantaLoop", href: "#why-quanta-loop" },
  { key: "pricing", href: "#access" },
] as const;

const sectionIds = navLinkKeys.map((link) => link.href.slice(1));

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
        "group relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
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
          "pointer-events-none absolute inset-x-3.5 bottom-1.5 h-0.5 rounded-full bg-accent transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[border-color,background-color,box-shadow] duration-300",
        scrolled || mobileOpen
          ? "border-border/70 bg-background/92 shadow-subtle backdrop-blur-xl"
          : "border-transparent bg-background/75 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <div className="shrink-0 lg:justify-self-start">
          <Logo />
        </div>

        <nav
          className="hidden items-center gap-0.5 lg:flex lg:justify-self-center"
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

        <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
          <Link
            href={ROUTES.login}
            className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/80 hover:text-foreground sm:inline-flex"
          >
            {tCommon("signIn")}
          </Link>
          <CtaLink
            href={ROUTES.onboardingRole}
            variant="primary"
            size="sm"
            className="hidden shadow-sm lg:inline-flex"
          >
            {tCommon("getStarted")}
          </CtaLink>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-nav"
            aria-label={mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")}
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
          "overflow-hidden border-t transition-[max-height,opacity,border-color] duration-300 ease-out lg:hidden",
          mobileOpen
            ? "max-h-[min(28rem,80vh)] border-border/80 bg-background/96 opacity-100 backdrop-blur-xl"
            : "max-h-0 border-transparent opacity-0"
        )}
        aria-label="Mobile"
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-4 sm:px-6">
          <div className="mb-2 sm:hidden">
            <LanguageSwitcher />
          </div>
          {navLinks.map((item) => (
            <NavAnchor
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={activeSection === item.href.slice(1)}
              onClick={closeMobile}
              className="w-full px-4 py-3 text-base"
            />
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border/80 pt-4">
            <Link
              href={ROUTES.login}
              onClick={closeMobile}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {tCommon("signIn")}
            </Link>
            <CtaLink
              href={ROUTES.onboardingRole}
              variant="accent"
              size="md"
              className="w-full"
              onClick={closeMobile}
            >
              {tCommon("getStarted")}
            </CtaLink>
          </div>
        </div>
      </nav>
    </header>
  );
}
