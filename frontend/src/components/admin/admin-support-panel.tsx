"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AdminSupportRequestCard } from "@/components/admin/admin-support-request-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchAdminSupportRequests,
  resolveAdminSupportRequest,
  type AdminSupportRequestListParams,
} from "@/services/admin/admin.service";
import type {
  AdminSupportRequestIssue,
  AdminSupportRequestSummary,
} from "@/types/admin";

const SEARCH_DEBOUNCE_MS = 400;

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: "Onboarding & access",
  matching: "Materials & matching",
  billing: "Billing & membership",
  technical: "Technical issue",
  other: "Other",
};

type StatusFilter = "all" | "open" | "resolved";
type CategoryFilter =
  | "all"
  | "onboarding"
  | "matching"
  | "billing"
  | "technical"
  | "other";
type SourceFilter = "all" | "public" | "onboarding" | "dashboard";
type SortFilter = "newest" | "oldest";

function SummaryKpiCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group block w-full text-left">
      <Card
        className={
          active
            ? "border-zinc-500 bg-zinc-50 ring-2 ring-zinc-400"
            : "border-zinc-200/80 transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-50/50"
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums text-zinc-900">{value}</p>
        </CardContent>
      </Card>
    </button>
  );
}

export function AdminSupportPanel() {
  const [items, setItems] = useState<AdminSupportRequestIssue[]>([]);
  const [summary, setSummary] = useState<AdminSupportRequestSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [bulkResolving, setBulkResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo<AdminSupportRequestListParams>(
    () => ({
      search,
      status: statusFilter,
      category: categoryFilter,
      source: sourceFilter,
      sort,
      page,
      limit: 20,
    }),
    [search, statusFilter, categoryFilter, sourceFilter, sort, page]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminSupportRequests(listParams);
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load support requests");
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const pageIds = items.map((i) => i.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function resolveOne(id: string) {
    setResolvingId(id);
    try {
      await resolveAdminSupportRequest(id);
      toast.success("Support request marked resolved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resolve failed");
    } finally {
      setResolvingId(null);
    }
  }

  async function resolveSelected() {
    const openIds = items
      .filter((i) => selected.has(i.id) && i.status !== "resolved")
      .map((i) => i.id);
    if (!openIds.length) {
      toast.error("No open requests selected");
      return;
    }
    setBulkResolving(true);
    try {
      await Promise.all(openIds.map((id) => resolveAdminSupportRequest(id)));
      toast.success(
        `Resolved ${openIds.length} request${openIds.length === 1 ? "" : "s"}`
      );
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk resolve failed");
    } finally {
      setBulkResolving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const kpiOpenActive = statusFilter === "open";
  const kpiResolvedActive = statusFilter === "resolved";
  const kpiTotalActive = statusFilter === "all";
  const allOnPageSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));
  const selectedOpenCount = items.filter(
    (i) => selected.has(i.id) && i.status !== "resolved"
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Support requests
        </h1>
        <p className="text-sm text-zinc-600">
          Contact form submissions from the site, onboarding, and dashboard.
        </p>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryKpiCard
            label="Open"
            value={summary.open}
            active={kpiOpenActive}
            onClick={() => {
              setStatusFilter("open");
              setPage(1);
            }}
          />
          <SummaryKpiCard
            label="Resolved"
            value={summary.resolved}
            active={kpiResolvedActive}
            onClick={() => {
              setStatusFilter("resolved");
              setPage(1);
            }}
          />
          <SummaryKpiCard
            label="Total"
            value={summary.total}
            active={kpiTotalActive}
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          />
        </div>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, message…"
            aria-label="Search support requests"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as CategoryFilter);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All topics</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as SourceFilter);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All sources</option>
            <option value="public">Public site</option>
            <option value="onboarding">Onboarding</option>
            <option value="dashboard">Dashboard</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortFilter);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2 lg:col-span-1"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={toggleSelectAllOnPage}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Select all on page
        </label>
        {selectedOpenCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bulkResolving}
            onClick={() => void resolveSelected()}
          >
            Resolve selected ({selectedOpenCount})
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-36 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-zinc-200/80">
          <CardContent className="py-12 text-center text-sm text-zinc-600">
            No support requests match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((request) => (
            <AdminSupportRequestCard
              key={request.id}
              request={request}
              selected={selected.has(request.id)}
              onToggleSelect={toggleSelect}
              onResolve={(id) => void resolveOne(id)}
              resolving={resolvingId === request.id}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-sm text-zinc-600">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
