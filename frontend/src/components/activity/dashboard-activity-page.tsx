"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ROUTES } from "@/constants/routes";
import { useProviderOnlyRedirect } from "@/lib/use-provider-mvp-redirect";
import { fetchActivityTimeline } from "@/services/activity/activity.service";
import { useActivityFeedStore } from "@/store/activity-feed-store";
import type { TimelineEvent } from "@/types/timeline";

export function DashboardActivityPage() {
  const t = useTranslations("dashboard.activity");
  const isProvider = useProviderOnlyRedirect();
  const setStoreItems = useActivityFeedStore((s) => s.setItems);
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isProvider) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityTimeline(60);
      setItems(data);
      setStoreItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [isProvider, setStoreItems, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isProvider) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-1 sm:space-y-8 sm:py-8">
        <div className="space-y-2">
          <div className="h-8 w-full max-w-xs animate-pulse rounded-lg bg-zinc-100 sm:w-72" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-50" />
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm leading-relaxed text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-zinc-600">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href={ROUTES.interests}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-zinc-700 underline-offset-4 hover:underline sm:min-h-0 sm:text-xs"
        >
          {t("interestsLink")}
        </Link>
      </header>

      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5 sm:p-8">
        <ActivityTimeline items={items} emptyLabel={t("emptyWindow")} />
      </section>
    </div>
  );
}
