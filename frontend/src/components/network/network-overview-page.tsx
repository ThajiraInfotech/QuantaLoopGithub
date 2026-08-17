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
import { useProviderMvpRedirect } from "@/lib/use-provider-mvp-redirect";
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
  const isProvider = useProviderMvpRedirect();
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
      <div className="mx-auto max-w-4xl space-y-4 py-4">
        <div className="h-8 w-1/3 animate-pulse rounded-md bg-zinc-100" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
          <div className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
          <div className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error ?? t("unavailable")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("registeredParticipants")}</CardTitle>
            <CardDescription>{t("registeredParticipantsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900">
              {data.registeredParticipants ?? data.verifiedParticipants}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("activeListings")}</CardTitle>
            <CardDescription>{t("activeListingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900">
              {data.activeMaterials}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("opportunityMotion")}</CardTitle>
            <CardDescription>{t("opportunityMotionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900">
              {data.recentOpportunityActivity}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">{t("spotlightTitle")}</CardTitle>
          <CardDescription>{t("spotlightDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.spotlight.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("spotlightEmpty")}</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-zinc-50/40">
              {data.spotlight.map((row) => (
                <li
                  key={`${row.companyName}-${row.role}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-zinc-900">
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
