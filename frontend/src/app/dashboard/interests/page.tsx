"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import { InterestInboxCard } from "@/components/interests/interest-inbox-card";
import {
  bucketInterests,
  countInboxKpis,
} from "@/components/interests/interests-inventory-utils";
import { Button } from "@/components/ui/button";
import { primaryActionLinkClassName } from "@/components/ui/link-styles";
import { ROUTES } from "@/constants/routes";
import { canPublishMaterial } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import {
  fetchMyInterests,
  patchInterestWorkflowRequest,
  updateInterestStatusRequest,
  type InterestWorkflowAction,
} from "@/services/interests/interest.service";
import { fetchUnreadNotificationCount } from "@/services/notifications/notification.service";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import type { Interest } from "@/types/interest";

export default function InterestsPage() {
  const t = useTranslations("interests.inbox");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [items, setItems] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyInterests();
      setItems(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
      return [] as Interest[];
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openFromUrl = searchParams.get("open");
  const historyFromUrl = searchParams.get("history");
  const filterParam = searchParams.get("filter");

  useEffect(() => {
    if (historyFromUrl === "1") {
      setHistoryExpanded(true);
    }
  }, [historyFromUrl]);

  useEffect(() => {
    if (!openFromUrl || items.length === 0) return;
    setExpandedIds((prev) => {
      if (prev.has(openFromUrl)) return prev;
      const next = new Set(prev);
      next.add(openFromUrl);
      return next;
    });
  }, [items, openFromUrl]);

  const isProvider = canPublishMaterial(user);

  const displayItems = useMemo(() => {
    const MS_48H = 48 * 60 * 60 * 1000;
    const MS_7D = 7 * 24 * 60 * 60 * 1000;
    if (filterParam === "stale48h") {
      const cutoff = Date.now() - MS_48H;
      return items.filter(
        (i) =>
          i.status === "pending" &&
          new Date(i.createdAt).getTime() <= cutoff
      );
    }
    if (filterParam === "inactive7d") {
      const cutoff = Date.now() - MS_7D;
      return items.filter(
        (i) =>
          (i.status === "discussion" || i.status === "pickup_scheduled") &&
          new Date(i.updatedAt).getTime() <= cutoff
      );
    }
    if (filterParam === "active") {
      return items.filter(
        (i) => i.status === "discussion" || i.status === "pickup_scheduled"
      );
    }
    if (filterParam === "completed") {
      return items.filter((i) => i.status === "completed");
    }
    return items;
  }, [items, filterParam]);

  const { pending, active, history } = useMemo(
    () => bucketInterests(displayItems),
    [displayItems]
  );
  const kpis = useMemo(() => countInboxKpis(displayItems), [displayItems]);

  const filterLabel =
    filterParam === "stale48h"
      ? t("filterStale48h")
      : filterParam === "inactive7d"
        ? t("filterInactive7d")
        : filterParam === "active"
          ? t("filterActive")
          : filterParam === "completed"
            ? t("filterCompleted")
            : null;

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function respond(id: string, status: "accepted" | "rejected") {
    try {
      await updateInterestStatusRequest(id, status);
      toast.success(
        status === "accepted" ? t("toastDiscussionStarted") : t("toastDeclined")
      );
      await load();
      if (status === "accepted") {
        setExpandedIds((prev) => new Set(prev).add(id));
      }
      const n = await fetchUnreadNotificationCount();
      setUnreadCount(n);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function advanceWorkflow(id: string, status: InterestWorkflowAction) {
    try {
      await patchInterestWorkflowRequest(id, status);
      toast.success(t("toastUpdated"));
      await load();
      const n = await fetchUnreadNotificationCount();
      setUnreadCount(n);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Workflow update failed");
    }
  }

  function renderCard(interest: Interest, variant: "pending" | "active" | "history") {
    return (
      <InterestInboxCard
        interest={interest}
        isProvider={isProvider}
        variant={variant}
        expanded={expandedIds.has(interest.id)}
        onToggleExpand={() => toggleExpanded(interest.id)}
        onRespond={(id, status) => void respond(id, status)}
        onAdvanceWorkflow={(id, status) => void advanceWorkflow(id, status)}
        onRefresh={() => void load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((k) => (
            <div
              key={k}
              className="h-20 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
            />
          ))}
        </div>
        {[0, 1, 2].map((k) => (
          <div
            key={`card-${k}`}
            className="h-32 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6 sm:py-8">
        <p className="text-sm leading-relaxed text-pretty text-red-700" role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:h-9 sm:w-auto"
          onClick={() => void load()}
        >
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4 sm:space-y-8">
        <PageHeader isProvider={isProvider} pendingCount={0} />
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center sm:px-6 sm:py-12">
          <p className="text-sm font-medium text-pretty text-zinc-800">
            {isProvider ? t("emptyProvider") : t("emptyBuyer")}
          </p>
          <Link
            href={ROUTES.materials}
            className={primaryActionLinkClassName(
              "mt-6 h-12 w-full text-base sm:h-10 sm:w-auto sm:text-small"
            )}
          >
            {isProvider ? "View Materials" : "Browse materials"}
          </Link>
        </div>
      </div>
    );
  }

  if (filterLabel && displayItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4 sm:space-y-6">
        <PageHeader isProvider={isProvider} pendingCount={0} />
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <p className="font-medium">{filterLabel}</p>
          <p className="mt-1 text-pretty text-zinc-600">No interests match this filter right now.</p>
          <Link
            href={ROUTES.interests}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            {t("clearFilter")} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-8">
      <PageHeader isProvider={isProvider} pendingCount={kpis.pending} />

      {filterLabel ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-pretty">
            <span className="font-medium">Filter active:</span> {filterLabel}
          </p>
          <Link
            href={ROUTES.interests}
            className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline sm:min-h-0"
          >
            {t("clearFilter")}
          </Link>
        </div>
      ) : null}

      {isProvider ? (
        <div className="grid grid-cols-2 gap-3">
          <KpiTile label={t("pending")} value={kpis.pending} tone="amber" />
          <KpiTile label={t("inProgress")} value={kpis.active} tone="blue" />
        </div>
      ) : null}

      {pending.length > 0 ? (
        <InboxSection
          title={t("needsResponse")}
          description={
            isProvider
              ? `${pending.length} pending interest${pending.length === 1 ? "" : "s"} waiting on a decision.`
              : `${pending.length} interest${pending.length === 1 ? "" : "s"} awaiting provider response.`
          }
          tone="amber"
        >
          <ul className="space-y-4">
            {pending.map((i) => (
              <li key={i.id}>{renderCard(i, "pending")}</li>
            ))}
          </ul>
        </InboxSection>
      ) : null}

      {active.length > 0 ? (
        <InboxSection
          title={t("activeDiscussions")}
          description="Opportunities in progress — coordinate pickup and next steps."
        >
          <ul className="space-y-4">
            {active.map((i) => (
              <li key={i.id}>{renderCard(i, "active")}</li>
            ))}
          </ul>
        </InboxSection>
      ) : null}

      {history.length > 0 ? (
        <InboxSection
          title={`${t("pastDiscussions")} (${history.length})`}
          tone="muted"
          action={
            <button
              type="button"
              onClick={() => setHistoryExpanded((v) => !v)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline sm:min-h-0"
            >
              {historyExpanded ? "Hide past discussions" : "Show past discussions"}
            </button>
          }
        >
          {historyExpanded ? (
            <ul className="space-y-4">
              {history.map((i) => (
                <li key={i.id}>{renderCard(i, "history")}</li>
              ))}
            </ul>
          ) : null}
        </InboxSection>
      ) : null}

      {isProvider && pending.length === 0 && active.length === 0 && history.length > 0 ? (
        <p className="text-sm leading-relaxed text-pretty text-zinc-500">
          No active interests right now. Expand past discussions to review closed opportunities.
        </p>
      ) : null}
    </div>
  );
}

function PageHeader({
  isProvider,
  pendingCount,
}: {
  isProvider: boolean;
  pendingCount: number;
}) {
  const t = useTranslations("interests.inbox");

  return (
    <div>
      <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        {isProvider ? t("titleProvider") : t("titleBuyer")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-zinc-600">
        {isProvider
          ? pendingCount > 0
            ? `${pendingCount} interest${pendingCount === 1 ? "" : "s"} need${pendingCount === 1 ? "s" : ""} your response. Reply and advance deals here.`
            : "Message buyers, schedule pickup, and complete opportunities — all in one place."
          : "Track your signals and reply when providers respond."}
      </p>
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm shadow-zinc-950/5",
        tone === "amber" && value > 0 && "border-amber-200/90 bg-amber-50/50",
        tone === "blue" && value > 0 && "border-blue-200/90 bg-blue-50/40",
        value === 0 && "border-zinc-200/80 bg-white"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "amber" && value > 0 && "text-amber-900",
          tone === "blue" && value > 0 && "text-blue-900",
          value === 0 && "text-zinc-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InboxSection({
  title,
  description,
  tone = "default",
  action,
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "amber" | "muted";
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border p-4 sm:p-6",
        tone === "amber" && "border-amber-200/70 bg-amber-50/20",
        tone === "muted" && "border-zinc-200/80 bg-zinc-50/50",
        tone === "default" && "border-zinc-200/80 bg-white"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-pretty text-zinc-600">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
