"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { MaterialFitBadge } from "@/components/materials/material-fit-badge";
import { MatchLocationNote } from "@/components/materials/match-location-note";
import { RemindersStrip } from "@/components/reminders/reminders-strip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBadge } from "@/components/trust/role-badge";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { fetchMatchSuggestions } from "@/services/matches/match.service";
import { fetchMyInterests } from "@/services/interests/interest.service";
import { fetchNotifications } from "@/services/notifications/notification.service";
import { fetchOpportunityFeed } from "@/services/opportunities/opportunity.service";
import { fetchReminders } from "@/services/reminders/reminder.service";
import { fetchSavedMaterials } from "@/services/saved-materials/saved-material.service";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import type { Interest } from "@/types/interest";
import type { Notification } from "@/types/notification";
import type { OpportunityFeedSection } from "@/types/opportunity-feed";

const ACTIVE_INTEREST_STATUSES = new Set([
  "pending",
  "accepted",
  "discussion",
  "pickup_scheduled",
]);

function isBuyerSuggestions(
  d: unknown
): d is {
  items: {
    materialId: string;
    title: string;
    headline: string;
    location: string;
    materialType: string;
    providerCompany: string;
    score?: number;
  }[];
} {
  return (
    typeof d === "object" &&
    d !== null &&
    "items" in d &&
    Array.isArray((d as { items: unknown }).items)
  );
}

function isMaterialFeedItem(
  x: unknown
): x is {
  materialId: string;
  title: string;
  materialType: string;
  location: string;
  headline?: string;
  providerCompany?: string;
  compositeScore?: number;
  score?: number;
  priority?: string;
  locationScope?: "same_city" | "same_state" | "other_state" | "unknown";
  locationNote?: string;
  matchLabel?: string;
} {
  return (
    typeof x === "object" &&
    x !== null &&
    "materialId" in x &&
    typeof (x as { materialId: unknown }).materialId === "string" &&
    "title" in x &&
    typeof (x as { title: unknown }).title === "string"
  );
}

function materialFitScore(row: {
  compositeScore?: number;
  score?: number;
}): number | null {
  if (typeof row.compositeScore === "number") return row.compositeScore;
  if (typeof row.score === "number") return row.score;
  return null;
}

type KpiItem = {
  label: string;
  value: number;
  href: string;
};

function OverviewKpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-lg border border-zinc-200/80 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50/80"
        >
          <p className="text-2xl font-semibold tabular-nums text-zinc-900">
            {item.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}

export function BuyerDashboardHome() {
  const t = useTranslations("dashboard.home.buyer");
  const tNav = useTranslations("dashboard.nav");
  const user = useAuthStore((s) => s.user);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const { formatRelativeTime } = useLocalizedTime();

  const [interests, setInterests] = useState<Interest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [matchBlock, setMatchBlock] = useState<unknown>(null);
  const [feedSections, setFeedSections] = useState<OpportunityFeedSection[]>(
    []
  );
  const [savedCount, setSavedCount] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ints, notifs, match, desk, saved, reminders] = await Promise.all([
        fetchMyInterests().catch(() => [] as Interest[]),
        fetchNotifications().catch(() => ({ items: [], unreadCount: 0 })),
        fetchMatchSuggestions().catch(() => null),
        fetchOpportunityFeed().catch(() => [] as OpportunityFeedSection[]),
        fetchSavedMaterials().catch(() => []),
        fetchReminders().catch(() => []),
      ]);
      setInterests(ints);
      setNotifications(notifs.items.slice(0, 6));
      setUnreadCount(notifs.unreadCount);
      setMatchBlock(match);
      setFeedSections(desk);
      setSavedCount(saved.length);
      setFollowUpCount(reminders.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
    const id = window.setInterval(() => void load(), 120_000);
    return () => window.clearInterval(id);
  }, [load]);

  const profileCompletion = user?.profileCompletion ?? 0;

  const relevantFeedSection = feedSections.find(
    (s) => s.id === "relevant_this_week"
  );
  const relevantFromFeed =
    relevantFeedSection?.items?.filter(isMaterialFeedItem) ?? [];
  const matchBuyerItems =
    matchBlock && isBuyerSuggestions(matchBlock) ? matchBlock.items : [];
  const recommendedMaterials =
    relevantFromFeed.length > 0 ? relevantFromFeed : matchBuyerItems;

  const activeInterests = interests.filter((i) =>
    ACTIVE_INTEREST_STATUSES.has(i.status)
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-24 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        <div className="h-48 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <OverviewKpiStrip
          items={[
            {
              label: t("activeInterests"),
              value: activeInterests.length,
              href: ROUTES.interests,
            },
            {
              label: t("savedMaterials"),
              value: savedCount,
              href: ROUTES.saved,
            },
            {
              label: t("followUpsPending"),
              value: followUpCount,
              href: "#follow-ups",
            },
          ]}
        />
      </div>

      <Card className="border-zinc-200/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-700">
              {t("profileCompletion")}
            </p>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900">
              {profileCompletion}%
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? <RoleBadge role={user.role} /> : null}
            {profileCompletion < 100 ? (
              <Link
                href={ROUTES.profile}
                className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
              >
                {t("completeProfile")} →
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div id="follow-ups">
        <RemindersStrip />
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">{t("recommended")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendedMaterials.slice(0, 6).map((row) => {
            const fit = materialFitScore(row);
            return (
              <Link
                key={row.materialId}
                href={ROUTES.materialDetail(row.materialId)}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-3 transition-all duration-200 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-950/5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-zinc-900">{row.title}</p>
                  <p className="text-xs text-zinc-500">{row.location}</p>
                  <p className="text-xs text-zinc-500">
                    {row.materialType}
                    {row.providerCompany ? ` · ${row.providerCompany}` : ""}
                  </p>
                  {row.headline ? (
                    <p className="text-xs text-zinc-400">{row.headline}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {fit != null ? <MaterialFitBadge score={fit} /> : null}
                  {isMaterialFeedItem(row) ? (
                    <MatchLocationNote
                      locationScope={row.locationScope}
                      locationNote={row.locationNote}
                      className="text-right"
                    />
                  ) : null}
                  {isMaterialFeedItem(row) && row.priority === "high" ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      {t("priority")}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {recommendedMaterials.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("recommendedEmpty")}</p>
          ) : null}
          <Link
            href={ROUTES.materials}
            className="inline-block pt-1 text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            {t("browseAll")} →
          </Link>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">{t("myActiveInterests")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeInterests.slice(0, 5).map((i) => (
            <Link
              key={i.id}
              href={ROUTES.interests}
              className="block rounded-lg border border-zinc-100 bg-white px-3 py-2 transition-colors hover:border-zinc-200"
            >
              <p className="truncate text-sm font-medium text-zinc-900">
                {i.materialTitle}
              </p>
              <p className="text-xs capitalize text-zinc-500">{i.status}</p>
            </Link>
          ))}
          {activeInterests.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("recommendedEmpty")}</p>
          ) : null}
          <Link
            href={ROUTES.interests}
            className="inline-block pt-2 text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            {tNav("interests")} →
          </Link>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">{t("notifications")}</CardTitle>
          </div>
          <Link
            href={ROUTES.notifications}
            className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            {tNav("notifications")} →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">
                  {n.message}
                </p>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
          ))}
          {notifications.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("notificationsEmpty")}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
