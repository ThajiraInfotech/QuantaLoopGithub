"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProviderOnlyRedirect } from "@/lib/use-provider-mvp-redirect";
import { fetchNetworkOverview } from "@/services/network/network.service";
import type { NetworkOverview } from "@/types/network";
import type { UserRole } from "@/types/user";

function useRoleLabel() {
  const t = useTranslations("common.roles");
  return (role: string) => {
    if (role === "material_provider") return t("material_provider");
    if (role === "verified_buyer") return t("verified_buyer");
    if (role === "admin") return t("admin");
    return role;
  };
}

export function NetworkOverviewPage() {
  const t = useTranslations("dashboard.network");
  const roleLabel = useRoleLabel();
  const isProvider = useProviderOnlyRedirect();
  const [data, setData] = useState<NetworkOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isProvider) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchNetworkOverview();
      setData(overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [isProvider, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isProvider) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 py-1 sm:space-y-8 sm:py-4">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-8 w-full max-w-md animate-pulse rounded-lg bg-zinc-100 sm:h-9" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded-md bg-zinc-50" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50 sm:h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
        {error ?? t("unavailable")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 sm:space-y-10">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t("eyebrow")}
        </p>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
          {t("pageTitle")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-pretty text-zinc-600">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-base">{t("registeredParticipants")}</CardTitle>
            <CardDescription className="leading-relaxed">
              {t("registeredParticipantsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
            <p className="text-[1.75rem] font-semibold tabular-nums text-zinc-900 sm:text-3xl">
              {data.registeredParticipants ?? data.verifiedParticipants}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-base">{t("activeListings")}</CardTitle>
            <CardDescription className="leading-relaxed">
              {t("activeListingsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
            <p className="text-[1.75rem] font-semibold tabular-nums text-zinc-900 sm:text-3xl">
              {data.activeMaterials}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-base">{t("opportunityMotion")}</CardTitle>
            <CardDescription className="leading-relaxed">
              {t("opportunityMotionDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
            <p className="text-[1.75rem] font-semibold tabular-nums text-zinc-900 sm:text-3xl">
              {data.recentOpportunityActivity}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">{t("spotlightTitle")}</CardTitle>
          <CardDescription className="leading-relaxed">{t("spotlightDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {data.spotlight.length === 0 ? (
            <p className="text-sm leading-relaxed text-zinc-500">{t("spotlightEmpty")}</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-zinc-50/40">
              {data.spotlight.map((row) => (
                <li
                  key={`${row.companyName}-${row.role}`}
                  className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2.5"
                >
                  <span className="text-sm font-medium text-pretty text-zinc-900">
                    {row.companyName}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {roleLabel(row.role as UserRole)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
