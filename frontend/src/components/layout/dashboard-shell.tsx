"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { MembershipExpiryNotice } from "@/components/subscriptions/membership-expiry-notice";
import { RoleBadge } from "@/components/trust/role-badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { fetchUnreadNotificationCount } from "@/services/notifications/notification.service";
import { logoutRequest } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import type { UserRole } from "@/types/user";

type NavLabelKey =
  | "overview"
  | "dashboard"
  | "profile"
  | "network"
  | "access"
  | "materials"
  | "interests"
  | "saved"
  | "activity"
  | "recommendations"
  | "insights"
  | "notifications"
  | "administration"
  | "participants"
  | "reports";

type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  roles?: readonly UserRole[];
  badgeFromStore?: "notifications";
};

const fullNavItems: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "overview" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.network, labelKey: "network" },
  { href: ROUTES.access, labelKey: "access" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
  { href: ROUTES.saved, labelKey: "saved", roles: ["verified_buyer"] },
  { href: ROUTES.activity, labelKey: "activity" },
  { href: ROUTES.recommendations, labelKey: "recommendations" },
  { href: ROUTES.insights, labelKey: "insights" },
  {
    href: ROUTES.notifications,
    labelKey: "notifications",
    badgeFromStore: "notifications",
  },
  { href: ROUTES.admin, labelKey: "administration", roles: ["admin"] },
];

const buyerPrimaryNav: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "overview" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.access, labelKey: "access" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
  { href: ROUTES.saved, labelKey: "saved" },
  {
    href: ROUTES.notifications,
    labelKey: "notifications",
    badgeFromStore: "notifications",
  },
];

const providerPrimaryNav: NavItem[] = [
  { href: ROUTES.dashboard, labelKey: "dashboard" },
  { href: ROUTES.profile, labelKey: "profile" },
  { href: ROUTES.access, labelKey: "access" },
  { href: ROUTES.materials, labelKey: "materials" },
  { href: ROUTES.interests, labelKey: "interests" },
  {
    href: ROUTES.notifications,
    labelKey: "notifications",
    badgeFromStore: "notifications",
  },
];

const adminPrimaryNav: NavItem[] = [
  { href: ROUTES.admin, labelKey: "dashboard" },
  { href: ROUTES.adminParticipants, labelKey: "participants" },
  { href: ROUTES.adminMaterials, labelKey: "materials" },
  { href: ROUTES.adminInterests, labelKey: "interests" },
  { href: ROUTES.adminReports, labelKey: "reports" },
  {
    href: ROUTES.notifications,
    labelKey: "notifications",
    badgeFromStore: "notifications",
  },
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
  unreadCount,
  compact = false,
}: {
  item: NavItem;
  label: string;
  pathname: string;
  unreadCount: number;
  compact?: boolean;
}) {
  const active = isNavActive(pathname, item.href);
  const showBadge =
    item.badgeFromStore === "notifications" && unreadCount > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md font-medium transition-colors",
        compact
          ? "whitespace-nowrap px-3 py-1.5 text-xs"
          : "px-3 py-2 text-sm",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      <span>{label}</span>
      {showBadge ? (
        <span
          className={cn(
            "rounded-full bg-zinc-900 font-semibold text-white",
            compact
              ? "px-1.5 py-0.5 text-[9px]"
              : "px-2 py-0.5 text-[10px] uppercase tracking-wide"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
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
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

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
    if (!user) return;
    let cancelled = false;
    fetchUnreadNotificationCount()
      .then((n) => {
        if (!cancelled) setUnreadCount(n);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pathname, setUnreadCount]);

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
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200/80 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-zinc-200/80 px-5">
          <Logo className="text-sm" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {localizedNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              label={item.label}
              pathname={pathname}
              unreadCount={unreadCount}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-200/80 bg-white px-3 py-2 lg:hidden">
          {localizedNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              label={item.label}
              pathname={pathname}
              unreadCount={unreadCount}
              compact
            />
          ))}
        </div>

        <header className="flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-zinc-900">
                {user?.companyName ?? tCommon("workspace")}
              </span>
              {user && user.role !== "admin" ? (
                <RoleBadge role={user.role} className="hidden sm:inline-flex" />
              ) : null}
            </div>
            <span className="truncate text-xs text-zinc-500">
              {user ? ROLE_LABELS[user.role] : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              {tCommon("signOut")}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <MembershipExpiryNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
