"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import {
  actionableInterestCountByMaterial,
  isCompletedMaterial,
} from "@/components/materials/materials-inventory-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { primaryActionLinkClassName } from "@/components/ui/link-styles";
import { ROUTES } from "@/constants/routes";
import { useDashboardGreeting, useLocalizedTime } from "@/hooks/use-localized-time";
import { fetchMaterials } from "@/services/materials/material.service";
import { fetchMyInterests } from "@/services/interests/interest.service";
import { useAuthStore } from "@/store/auth-store";
import type { Interest } from "@/types/interest";
import type { Material } from "@/types/material";
import { cn } from "@/lib/utils";

const LISTABLE = ["available", "active", "in_discussion"];

export function ProviderDashboardHome() {
  const t = useTranslations("dashboard.home.provider");
  const user = useAuthStore((s) => s.user);
  const { formatRelativeTime } = useLocalizedTime();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mats, ints] = await Promise.all([
        fetchMaterials().catch(() => [] as Material[]),
        fetchMyInterests().catch(() => [] as Interest[]),
      ]);
      setMaterials(mats);
      setInterests(ints);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const activeMaterials = materials.filter((m) => LISTABLE.includes(m.status));
  const pendingInterests = interests.filter((i) => i.status === "pending");
  const interestsReceived = interests.length;
  const hasNoActiveMaterials = activeMaterials.length === 0;
  const displayName = user?.companyName?.trim() || user?.name?.trim() || "";
  const greeting = useDashboardGreeting(displayName);

  const interestCountByMaterial = actionableInterestCountByMaterial(interests);
  const sortedMaterials = [...materials].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 py-1 sm:space-y-8 sm:py-4">
        <div className="space-y-2">
          <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-zinc-100 sm:h-9 sm:w-72" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-zinc-50 sm:w-96" />
        </div>
        <div className="h-36 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50 sm:h-24" />
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              className="h-20 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50 sm:h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-pretty text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 sm:space-y-8">
      <header className="space-y-1.5 sm:space-y-2">
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
          {greeting}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-pretty text-zinc-500">
          {t("subtitle")}
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.04] sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {t("quickActions")}
        </h2>
        <div className="mt-4 space-y-3">
          <Link
            href={ROUTES.materialsNew}
            className={cn(
              primaryActionLinkClassName(),
              "h-12 w-full text-base font-semibold sm:h-14 sm:text-lg"
            )}
          >
            + {t("publishMaterial")}
          </Link>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={ROUTES.interests}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 sm:h-11 sm:py-0"
            >
              {t("viewInterests")}
              {pendingInterests.length > 0 ? (
                <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {pendingInterests.length}
                </span>
              ) : null}
            </Link>
            <Link
              href={ROUTES.profile}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 sm:h-11 sm:py-0"
            >
              {t("completeProfile")}
            </Link>
          </div>
        </div>
      </section>

      {hasNoActiveMaterials ? (
        <section className="relative overflow-hidden rounded-2xl border border-dashed border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-white px-4 py-8 text-center shadow-sm shadow-emerald-950/[0.03] sm:px-12 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl"
          />
          <div className="relative mx-auto max-w-md space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-balance text-zinc-900 sm:text-xl">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-pretty text-zinc-600">
              {t("emptyDescription")}
            </p>
            <Link
              href={ROUTES.materialsNew}
              className={cn(
                primaryActionLinkClassName(),
                "mt-5 h-12 w-full px-8 text-base shadow-sm shadow-emerald-900/10 sm:w-auto"
              )}
            >
              + {t("publishMaterial")}
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label={t("activeMaterials")}
          value={activeMaterials.length}
          href={ROUTES.materials}
          tone="neutral"
        />
        <StatCard
          label={t("pendingInterests")}
          value={pendingInterests.length}
          href={ROUTES.interests}
          tone={pendingInterests.length > 0 ? "highlight" : "neutral"}
        />
        <StatCard
          label={t("interestsReceived")}
          value={interestsReceived}
          href={ROUTES.interests}
          tone={interestsReceived > 0 ? "highlight" : "neutral"}
        />
      </div>

      {pendingInterests.length > 0 ? (
        <Card className="border-amber-200/80 bg-amber-50/40">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-base">{t("needsResponse")}</CardTitle>
            <CardDescription>
              {t("needsResponseDescription", { count: pendingInterests.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-4 sm:p-6 sm:pt-6">
            {interests
              .filter((i) => i.status === "pending")
              .slice(0, 3)
              .map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-white px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {i.materialTitle}
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      {i.buyer?.companyName ?? t("buyerFallback")} ·{" "}
                      {formatRelativeTime(i.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={ROUTES.interestsOpen(i.id)}
                    className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-zinc-800 underline-offset-4 hover:underline sm:min-h-0 sm:text-xs"
                  >
                    {t("respond")} →
                  </Link>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}

      {sortedMaterials.length > 0 ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="flex flex-col gap-2 space-y-0 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <CardTitle className="text-base">{t("yourMaterials")}</CardTitle>
              <CardDescription>{t("yourMaterialsDescription")}</CardDescription>
            </div>
            <Link
              href={ROUTES.materials}
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-zinc-700 underline-offset-4 hover:underline sm:min-h-0 sm:text-xs"
            >
              {t("viewAll")} →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-4 sm:p-6 sm:pt-6">
            {sortedMaterials.slice(0, 5).map((m) => {
              const interestCount = isCompletedMaterial(m.status)
                ? 0
                : interestCountByMaterial.get(m.id) ?? 0;
              return (
                <Link
                  key={m.id}
                  href={ROUTES.materialDetail(m.id)}
                  className="flex min-h-11 flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-3 transition-colors hover:border-zinc-200 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {m.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {m.materialType} · {m.location}
                    </p>
                    <p className="mt-1 text-xs font-medium text-zinc-600">
                      {interestCount > 0
                        ? t("interestsReceivedCount", { count: interestCount })
                        : t("lastUpdated", {
                            time: formatRelativeTime(m.updatedAt),
                          })}
                    </p>
                  </div>
                  <MaterialStatusBadge status={m.status} />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

type StatTone = "neutral" | "highlight";

const STAT_TONE_STYLES: Record<StatTone, string> = {
  neutral: "border-zinc-200/80 bg-white",
  highlight: "border-emerald-300/90 bg-emerald-50/70 ring-1 ring-emerald-200/60",
};

const STAT_VALUE_STYLES: Record<StatTone, string> = {
  neutral: "text-zinc-900",
  highlight: "text-emerald-900",
};

function StatCard({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number | string;
  href: string;
  tone: StatTone;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border p-4 shadow-sm shadow-zinc-950/[0.04] transition-all hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-950/[0.06] sm:p-5 sm:hover:-translate-y-0.5",
        STAT_TONE_STYLES[tone]
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-[1.75rem] font-semibold tabular-nums sm:text-3xl",
          STAT_VALUE_STYLES[tone]
        )}
      >
        {value}
      </p>
    </Link>
  );
}
