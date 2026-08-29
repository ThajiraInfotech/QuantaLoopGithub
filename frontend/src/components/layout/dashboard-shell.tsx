"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationRealtimeProvider } from "@/components/notifications/notification-realtime-provider";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { ContactSupportModal } from "@/components/support/contact-support-modal";
import { MembershipExpiryNotice } from "@/components/subscriptions/membership-expiry-notice";
import { RoleBadge } from "@/components/trust/role-badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { logoutRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/user";

type NavLabelKey =
  | "overview"
  | "dashboard"
  | "profile"
  | "network"
  | "materials"
  | "interests"
  | "saved"
  | "activity"
  | "recommendations"
  | "insights"
  | "administration"
  | "participants"
  | "reports"
  | "support"
  | "invoices"
  | "security";

type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  roles?: readonly UserRole[];
};

const fullNavItems: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "overview" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.network, labelKey: "network" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
  { href: ROUTES.saved, labelKey: "saved", roles: ["verified_buyer"] },
  { href: ROUTES.activity, labelKey: "activity" },
  { href: ROUTES.recommendations, labelKey: "recommendations" },
  { href: ROUTES.insights, labelKey: "insights" },
  { href: ROUTES.admin, labelKey: "administration", roles: ["admin"] },
];

const buyerPrimaryNav: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "overview" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
  { href: ROUTES.saved, labelKey: "saved" },
];

const providerPrimaryNav: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "dashboard" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
];

const adminPrimaryNav: NavItem[] = [
  { href: ROUTES.admin, labelKey: "dashboard" },
  { href: ROUTES.adminParticipants, labelKey: "participants" },
  { href: ROUTES.adminMaterials, labelKey: "materials" },
  { href: ROUTES.adminInterests, labelKey: "interests" },
  { href: ROUTES.adminReports, labelKey: "reports" },
  { href: ROUTES.adminSupport, labelKey: "support" },
  { href: ROUTES.adminInvoices, labelKey: "invoices" },
  { href: ROUTES.adminSecurity, labelKey: "security" },
];

function isNavActive(pathname: string, href: string) {
  if (href === ROUTES.admin) {
    return pathname === ROUTES.admin;
  }
  if (href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function filterNav(items: NavItem[], role: UserRole | undefined) {
  return items.filter((item) => !item.roles || (role && item.roles.includes(role)));
}

function NavLink({
  item,
  label,
  pathname,
  onSelect,
  size = "sidebar",
}: {
  item: NavItem;
  label: string;
  pathname: string;
  onSelect?: () => void;
  size?: "sidebar" | "drawer";
}) {
  const active = isNavActive(pathname, item.href);
  const drawer = size === "drawer";

  return (
    <Link
      href={item.href}
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg font-medium transition-colors",
        drawer
          ? "min-h-11 px-3 py-2.5 text-base"
          : "px-3 py-2 text-sm",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("dashboard.nav");
  const tCommon = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const isProvider = user?.role === "material_provider";
  const isBuyer = user?.role === "verified_buyer";
  const isAdmin = user?.role === "admin";
  const primaryNav = isAdmin
    ? adminPrimaryNav
    : isProvider
      ? providerPrimaryNav
      : isBuyer
        ? buyerPrimaryNav
        : filterNav(fullNavItems, user?.role);

  const localizedNav = useMemo(
    () =>
      primaryNav.map((item) => ({
        ...item,
        label: tNav(item.labelKey),
      })),
    [primaryNav, tNav]
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      /* cookie clear is best-effort */
    } finally {
      clearSession();
      router.replace(ROUTES.login);
    }
  }

  return (
    <NotificationRealtimeProvider>
    <div className="flex min-h-svh bg-zinc-50">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-200/80 px-5">
          <Logo className="h-8" />
        </div>
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-3"
          aria-label={tNav("dashboard")}
        >
          {localizedNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              label={item.label}
              pathname={pathname}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 shrink-0 p-0 lg:hidden"
                aria-expanded={mobileNavOpen}
                aria-controls="dashboard-mobile-nav"
                aria-label={
                  mobileNavOpen ? tCommon("closeMenu") : tCommon("openMenu")
                }
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                {mobileNavOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden />
                )}
              </Button>
              <Logo className="h-8 lg:hidden" />
              <div className="hidden min-w-0 flex-col gap-0.5 lg:flex">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-zinc-900">
                    {user?.companyName ?? tCommon("workspace")}
                  </span>
                  {user && user.role !== "admin" ? (
                    <RoleBadge role={user.role} />
                  ) : null}
                </div>
                <span className="truncate text-xs text-zinc-500">
                  {user ? ROLE_LABELS[user.role] : ""}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher
                compact
                className="hidden sm:inline-flex [&_select]:h-10 [&_select]:min-h-10 sm:[&_select]:h-8 sm:[&_select]:min-h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 whitespace-nowrap px-2.5 text-xs sm:h-9 sm:px-3 sm:text-small"
                onClick={() => setSupportOpen(true)}
              >
                {tNav("support")}
              </Button>
              <NotificationBell />
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0 whitespace-nowrap px-2.5 text-xs sm:h-9 sm:px-3 sm:text-small"
                onClick={handleLogout}
              >
                {tCommon("signOut")}
              </Button>
            </div>
          </div>
        </header>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
            aria-label={tCommon("closeMenu")}
            onClick={closeMobileNav}
          />
        ) : null}

        <div
          id="dashboard-mobile-nav"
          role={mobileNavOpen ? "dialog" : undefined}
          aria-modal={mobileNavOpen || undefined}
          aria-label={tNav("dashboard")}
          aria-hidden={!mobileNavOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.75rem))] flex-col border-r border-zinc-200 bg-white pt-[env(safe-area-inset-top)] shadow-xl shadow-zinc-950/10 transition-transform duration-200 ease-out lg:hidden",
            mobileNavOpen
              ? "translate-x-0"
              : "pointer-events-none -translate-x-full"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4">
            <Logo className="h-8" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              aria-label={tCommon("closeMenu")}
              onClick={closeMobileNav}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user?.companyName ?? tCommon("workspace")}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
            <div className="mt-3 sm:hidden">
              <LanguageSwitcher />
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-3">
            {localizedNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                label={item.label}
                pathname={pathname}
                size="drawer"
                onSelect={closeMobileNav}
              />
            ))}
          </nav>
          <div className="border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-2 h-11 w-full"
              onClick={() => {
                closeMobileNav();
                setSupportOpen(true);
              }}
            >
              {tNav("support")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-11 w-full"
              onClick={() => {
                closeMobileNav();
                void handleLogout();
              }}
            >
              {tCommon("signOut")}
            </Button>
          </div>
        </div>

        <main className="min-w-0 flex-1 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-10">
          <MembershipExpiryNotice />
          {children}
        </main>
      </div>

      <ContactSupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        source="dashboard"
        defaultName={user?.name}
        defaultEmail={user?.email}
        defaultCompanyName={user?.companyName}
      />
    </div>
    </NotificationRealtimeProvider>
  );
}
