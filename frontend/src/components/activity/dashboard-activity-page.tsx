"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ROUTES } from "@/constants/routes";
import { useProviderMvpRedirect } from "@/lib/use-provider-mvp-redirect";
import { fetchActivityTimeline } from "@/services/activity/activity.service";
import { useActivityFeedStore } from "@/store/activity-feed-store";
import type { TimelineEvent } from "@/types/timeline";

export function DashboardActivityPage() {
  const t = useTranslations("dashboard.activity");
  const isProvider = useProviderMvpRedirect();
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
      <div className="mx-auto max-w-3xl space-y-3 py-8">
        <div className="h-10 w-1/2 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-64 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href={ROUTES.interests}
          className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
        >
          {t("interestsLink")}
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
        <ActivityTimeline items={items} emptyLabel={t("emptyWindow")} />
      </section>
    </div>
  );
}
