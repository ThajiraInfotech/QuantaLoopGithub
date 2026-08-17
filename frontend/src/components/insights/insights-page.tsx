"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { InsightCard } from "@/components/insights/insight-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderMvpRedirect } from "@/lib/use-provider-mvp-redirect";
import {
  fetchActivitySignalsSummary,
  fetchOperationalInsights,
} from "@/services/insights/insight.service";
import { useAuthStore } from "@/store/auth-store";
import { useEngagementSignalStore } from "@/store/engagement-signal-store";
import { useInsightStore } from "@/store/insight-store";
import type { OperationalInsight } from "@/types/insight";

const POLL_MS = 90_000;

export function InsightsPage() {
  const t = useTranslations("dashboard.insights");
  const isProvider = useProviderMvpRedirect();
  const user = useAuthStore((s) => s.user);
  const setInsightsStore = useInsightStore((s) => s.setInsights);
  const setSignalsStore = useInsightStore((s) => s.setSignals);
  const setEngagementSummary = useEngagementSignalStore((s) => s.setSummary);

  const [insights, setInsights] = useState<OperationalInsight[]>([]);
  const [engagementScore, setEngagementScore] = useState<number | null>(null);
  const [responseLabel, setResponseLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isProvider) return;
    try {
      const [ins, signals] = await Promise.all([
        fetchOperationalInsights(),
        fetchActivitySignalsSummary().catch(() => null),
      ]);
      setInsights(ins);
      setInsightsStore(ins);
      if (signals) {
        setEngagementScore(signals.engagementScore);
        setResponseLabel(signals.responseQuality?.label ?? null);
        setSignalsStore(signals);
        setEngagementSummary(signals);
        setLastRefresh(signals.refreshedAt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [isProvider, setEngagementSummary, setInsightsStore, setSignalsStore, t]);

  useEffect(() => {
    if (isProvider) return;
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [isProvider, load]);

  if (isProvider) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <div className="h-10 w-1/2 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-32 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {t("subtitle")}
        </p>
        {lastRefresh ? (
          <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-400">
            {t("refreshed", {
              time: new Date(lastRefresh).toLocaleTimeString(),
            })}
          </p>
        ) : null}
      </div>

      {user?.role === "material_provider" ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("responseHistory")}</CardTitle>
            <CardDescription>{t("responseHistoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">
            {responseLabel && engagementScore != null && engagementScore > 0 ? (
              <div className="flex flex-wrap gap-6">
                <p>
                  {t("responseQuality")}{" "}
                  <span className="font-semibold text-zinc-900">
                    {responseLabel}
                  </span>
                </p>
              </div>
            ) : (
              <p className="leading-relaxed text-zinc-600">{t("responseEmpty")}</p>
            )}
          </CardContent>
        </Card>
      ) : (engagementScore != null || responseLabel) ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("networkPosture")}</CardTitle>
            <CardDescription>{t("networkPostureDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm text-zinc-700">
            {engagementScore != null ? (
              <p>
                {t("engagementIndex")}{" "}
                <span className="font-semibold text-zinc-900">
                  {engagementScore}
                </span>
              </p>
            ) : null}
            {responseLabel ? (
              <p>
                {t("responseQuality")}{" "}
                <span className="font-semibold text-zinc-900">
                  {responseLabel}
                </span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {insights.map((ins) => (
          <InsightCard key={ins.id} insight={ins} />
        ))}
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("empty")}</p>
      ) : null}
    </div>
  );
}
