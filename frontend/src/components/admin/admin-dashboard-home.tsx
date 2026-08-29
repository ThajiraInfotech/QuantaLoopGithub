"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { RoleBadge } from "@/components/trust/role-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { fetchAdminDashboard } from "@/services/admin/admin.service";
import type { AdminDashboardData } from "@/types/admin";
import { formatRelativeTime } from "@/utils/format-relative-time";

const REPORT_REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

function formatGrowthLabel(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% this month`;
}

function KpiCard({
  label,
  value,
  href,
  growthPct,
}: {
  label: string;
  value: number;
  href?: string;
  growthPct?: number;
}) {
  const card = (
    <Card
      className={
        href
          ? "border-zinc-200/80 transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-50/50"
          : "border-zinc-200/80"
      }
    >
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p
          className={
            href
              ? "text-3xl font-semibold tabular-nums text-zinc-900 group-hover:text-zinc-950"
              : "text-3xl font-semibold tabular-nums text-zinc-900"
          }
        >
          {value}
        </p>
        {typeof growthPct === "number" ? (
          <p
            className={`mt-1 text-xs font-medium tabular-nums ${
              growthPct >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {formatGrowthLabel(growthPct)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {card}
      </Link>
    );
  }

  return card;
}

function ActionCard({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-zinc-200/80 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      <p className="text-2xl font-semibold tabular-nums text-zinc-900 group-hover:text-zinc-950">
        {count}
      </p>
      <p className="mt-1 text-sm text-zinc-600">{label}</p>
    </Link>
  );
}

function FunnelStep({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="min-w-[140px] flex-1">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <p className="text-lg font-semibold tabular-nums text-zinc-900">
          {value}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-800 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {max > 0 ? (
        <p className="mt-1 text-[10px] text-zinc-400">{pct}% of created</p>
      ) : null}
    </div>
  );
}

function reportTargetHref(r: AdminDashboardData["recentIssues"]["openReports"][0]) {
  if (r.targetType === "participant" && r.targetUserId) {
    return ROUTES.adminParticipantDetail(r.targetUserId);
  }
  if (r.targetType === "material" && r.targetMaterialId) {
    return ROUTES.materialDetail(r.targetMaterialId);
  }
  return ROUTES.adminReports;
}

export function AdminDashboardHome() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const stats = await fetchAdminDashboard();
      setData(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 120_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 py-4">
        <div className="h-8 w-1/3 animate-pulse rounded-md bg-zinc-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error ?? "Unable to load dashboard"}
      </div>
    );
  }

  const {
    kpis,
    actionRequired,
    platformActivity,
    dealFunnel,
    recentParticipants,
    recentIssues,
  } = data;

  const conversionRate =
    dealFunnel.interestCreated > 0
      ? Math.round((dealFunnel.completed / dealFunnel.interestCreated) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Platform control center
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Platform health, growth monitoring, and operational oversight.
        </p>
      </div>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Registered participants"
            value={kpis.participants}
            href={ROUTES.adminParticipants}
            growthPct={kpis.participantsGrowthPct}
          />
          <KpiCard
            label="Materials"
            value={kpis.materials}
            href={ROUTES.adminMaterials}
            growthPct={kpis.materialsGrowthPct}
          />
          <KpiCard
            label="Active deals"
            value={kpis.activeDeals}
            href={ROUTES.adminInterestsInDiscussion}
          />
          <KpiCard
            label="Completed deals"
            value={kpis.completedDeals}
            href={ROUTES.adminInterestsCompleted}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Action required
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <ActionCard
            label="Open reports"
            count={actionRequired.openReports}
            href={ROUTES.adminReports}
          />
          <ActionCard
            label="Open support"
            count={actionRequired.openSupportRequests}
            href={ROUTES.adminSupport}
          />
          <ActionCard
            label="Interests waiting &gt;48h"
            count={actionRequired.interestsWaiting48h}
            href={ROUTES.adminInterestsPending}
          />
          <ActionCard
            label="Discussions inactive &gt;7d"
            count={actionRequired.inactiveDiscussions7d}
            href={ROUTES.adminInterestsInDiscussion}
          />
          <ActionCard
            label="Suspended accounts"
            count={actionRequired.recentlySuspended}
            href={`${ROUTES.adminParticipants}?account=suspended`}
          />
        </div>
      </section>

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Recent participants</CardTitle>
            <CardDescription>
              Latest registrations across the network.
            </CardDescription>
          </div>
          <Link
            href={ROUTES.adminParticipants}
            className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500">No participants yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentParticipants.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <Link
                      href={ROUTES.adminParticipantDetail(row.id)}
                      className="truncate text-sm font-medium text-zinc-900 hover:underline"
                    >
                      {row.companyName}
                    </Link>
                    <RoleBadge role={row.role} />
                  </div>
                  <p className="shrink-0 text-xs text-zinc-400">
                    Joined {formatRelativeTime(row.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Platform activity
        </h2>
        <p className="mb-3 text-xs text-zinc-500">Last 7 days</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="New participants"
            value={platformActivity.newParticipantsThisWeek}
          />
          <KpiCard
            label="Materials published"
            value={platformActivity.newMaterialsPublished}
          />
          <KpiCard
            label="Interests created"
            value={platformActivity.interestsCreated}
          />
          <KpiCard
            label="Deals completed"
            value={platformActivity.dealsCompleted}
          />
        </div>
      </section>

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Deal funnel</CardTitle>
            <CardDescription>
              Where deals progress or stall across the network.
            </CardDescription>
          </div>
          <p className="text-sm font-medium text-zinc-700">
            Conversion rate:{" "}
            <span className="tabular-nums text-zinc-900">{conversionRate}%</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <FunnelStep
              label="Interest created"
              value={dealFunnel.interestCreated}
              max={dealFunnel.interestCreated}
            />
            <FunnelStep
              label="Discussion started"
              value={dealFunnel.discussionStarted}
              max={dealFunnel.interestCreated}
            />
            <FunnelStep
              label="Pickup scheduled"
              value={dealFunnel.pickupScheduled}
              max={dealFunnel.interestCreated}
            />
            <FunnelStep
              label="Completed"
              value={dealFunnel.completed}
              max={dealFunnel.interestCreated}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Open reports</CardTitle>
            <Link
              href={ROUTES.adminReports}
              className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIssues.openReports.length === 0 ? (
              <p className="text-sm text-zinc-500">No open reports.</p>
            ) : (
              recentIssues.openReports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {r.targetType === "participant" ? "Participant" : "Material"}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-900">
                    {r.targetLabel}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                  </p>
                  <Link
                    href={reportTargetHref(r)}
                    className="mt-2 inline-block text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
                  >
                    Open {r.targetType === "participant" ? "participant" : "material"} →
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Inactive discussions</CardTitle>
            <Link
              href={ROUTES.adminInterestsInDiscussion}
              className="text-xs font-medium text-zinc-700 underline-offset-4 hover:underline"
            >
              View interests →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIssues.inactiveDiscussions.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No stale discussions detected.
              </p>
            ) : (
              recentIssues.inactiveDiscussions.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {d.materialTitle || "Untitled material"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Last activity{" "}
                    {d.lastMessageAt
                      ? formatRelativeTime(d.lastMessageAt)
                      : formatRelativeTime(d.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
