"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AdminReportCard } from "@/components/admin/admin-report-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import {
  fetchAdminReports,
  fetchAllAdminReports,
  type AdminReportListParams,
} from "@/services/admin/admin.service";
import { resolveReportRequest } from "@/services/reports/report.service";
import type {
  AdminReportIssue,
  AdminReportReporterOption,
  AdminReportSummary,
} from "@/types/admin";
import { formatMediumDate } from "@/utils/format-relative-time";

const SEARCH_DEBOUNCE_MS = 400;

const REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

type StatusFilter = "all" | "open" | "resolved";
type TargetFilter = "all" | "material" | "participant";
type ReasonFilter =
  | "all"
  | "misleading_information"
  | "spam"
  | "inactive_participant";
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

function downloadReportsCsv(rows: AdminReportIssue[]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const header = [
    "Report ID",
    "Status",
    "Target Type",
    "Target",
    "Reporter",
    "Reason",
    "Created",
    "Resolved",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.reportRefId ?? row.id,
        row.status ?? "open",
        row.targetType,
        row.targetLabel,
        row.reporterCompany ?? "",
        REASON_LABELS[row.reason] ?? row.reason,
        formatMediumDate(row.createdAt),
        row.resolvedAt ? formatMediumDate(row.resolvedAt) : "",
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminReportsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const participantFilter = searchParams.get("participant");
  const materialFilter = searchParams.get("material");
  const interestFilter = searchParams.get("interest");
  const reporterFilter = searchParams.get("reporter");
  const initialStatus = searchParams.get("status");
  const initialTargetType = searchParams.get("targetType");

  const [items, setItems] = useState<AdminReportIssue[]>([]);
  const [summary, setSummary] = useState<AdminReportSummary | null>(null);
  const [reporters, setReporters] = useState<AdminReportReporterOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    if (initialStatus === "resolved" || initialStatus === "open") {
      return initialStatus;
    }
    if (initialStatus === "all") return "all";
    return "open";
  });
  const [targetFilter, setTargetFilter] = useState<TargetFilter>(() => {
    if (initialTargetType === "material" || initialTargetType === "participant") {
      return initialTargetType;
    }
    return "all";
  });
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [reporterSelect, setReporterSelect] = useState(reporterFilter ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus === "open" || urlStatus === "resolved" || urlStatus === "all") {
      setStatusFilter(urlStatus);
    }
    const urlTargetType = searchParams.get("targetType");
    if (urlTargetType === "material" || urlTargetType === "participant") {
      setTargetFilter(urlTargetType);
    } else if (!urlTargetType) {
      setTargetFilter("all");
    }
    const urlReporter = searchParams.get("reporter");
    if (urlReporter) setReporterSelect(urlReporter);
  }, [searchParams]);

  const listParams = useMemo<AdminReportListParams>(
    () => ({
      search,
      status: statusFilter,
      targetType: targetFilter,
      reason: reasonFilter,
      reporter: reporterSelect || reporterFilter || undefined,
      participant: participantFilter ?? undefined,
      material: materialFilter ?? undefined,
      interest: interestFilter ?? undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort,
      page,
      limit: 20,
    }),
    [
      search,
      statusFilter,
      targetFilter,
      reasonFilter,
      reporterSelect,
      reporterFilter,
      participantFilter,
      materialFilter,
      interestFilter,
      dateFrom,
      dateTo,
      sort,
      page,
    ]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminReports(listParams);
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary);
      setReporters(result.reporters);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    void load();
  }, [load]);

  function pushFilters(
    next: Partial<{
      status: StatusFilter;
      targetType: TargetFilter;
      reporter: string;
    }>
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const nextStatus = next.status ?? statusFilter;
    const nextTarget = next.targetType ?? targetFilter;
    const nextReporter =
      next.reporter !== undefined ? next.reporter : reporterSelect;

    if (nextStatus === "open") params.delete("status");
    else params.set("status", nextStatus);

    if (nextReporter) params.set("reporter", nextReporter);
    else params.delete("reporter");

    if (nextTarget !== "all") params.set("targetType", nextTarget);
    else params.delete("targetType");

    setPage(1);
    router.push(
      params.toString()
        ? `${ROUTES.adminReports}?${params.toString()}`
        : ROUTES.adminReports,
      { scroll: false }
    );
  }

  function applyKpiFilter(
    nextStatus: StatusFilter,
    nextTarget: TargetFilter
  ) {
    setStatusFilter(nextStatus);
    setTargetFilter(nextTarget);
    pushFilters({ status: nextStatus, targetType: nextTarget });
  }

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
      await resolveReportRequest(id);
      toast.success("Report marked resolved");
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
      toast.error("No open reports selected");
      return;
    }
    setBulkResolving(true);
    try {
      await Promise.all(openIds.map((id) => resolveReportRequest(id)));
      toast.success(`Resolved ${openIds.length} report${openIds.length === 1 ? "" : "s"}`);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk resolve failed");
    } finally {
      setBulkResolving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows =
        selected.size > 0
          ? items.filter((i) => selected.has(i.id))
          : await fetchAllAdminReports({
              search,
              status: statusFilter,
              targetType: targetFilter,
              reason: reasonFilter,
              reporter: reporterSelect || reporterFilter || undefined,
              participant: participantFilter ?? undefined,
              material: materialFilter ?? undefined,
              interest: interestFilter ?? undefined,
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
              sort,
            });
      if (!rows.length) {
        toast.error("No reports to export");
        return;
      }
      downloadReportsCsv(rows);
      toast.success(`Exported ${rows.length} report${rows.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const kpiTotalActive =
    statusFilter === "all" &&
    targetFilter === "all" &&
    !participantFilter &&
    !materialFilter &&
    !interestFilter &&
    !reporterFilter &&
    !reporterSelect;
  const kpiOpenActive = statusFilter === "open" && targetFilter === "all";
  const kpiResolvedActive = statusFilter === "resolved" && targetFilter === "all";
  const kpiMaterialActive = statusFilter === "all" && targetFilter === "material";
  const kpiParticipantActive =
    statusFilter === "all" && targetFilter === "participant";
  const allOnPageSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));
  const selectedOpenCount = items.filter(
    (i) => selected.has(i.id) && i.status !== "resolved"
  ).length;

  const scopeLabel = interestFilter
    ? "Reports related to this interest"
    : materialFilter
      ? "Reports involving this material"
      : participantFilter
        ? "Reports involving this participant"
        : reporterFilter || reporterSelect
          ? "Reports from selected reporter"
          : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Reports
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Moderation hub for marketplace reports on materials and participants.
        </p>
        {scopeLabel ? (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-zinc-500">{scopeLabel}</p>
            <Link
              href={ROUTES.adminReports}
              className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← All reports
            </Link>
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryKpiCard
            label="Total reports"
            value={summary.total}
            active={kpiTotalActive}
            onClick={() => applyKpiFilter("all", "all")}
          />
          <SummaryKpiCard
            label="Open reports"
            value={summary.open}
            active={kpiOpenActive}
            onClick={() => applyKpiFilter("open", "all")}
          />
          <SummaryKpiCard
            label="Resolved reports"
            value={summary.resolved}
            active={kpiResolvedActive}
            onClick={() => applyKpiFilter("resolved", "all")}
          />
          <SummaryKpiCard
            label="Material reports"
            value={summary.material}
            active={kpiMaterialActive}
            onClick={() => applyKpiFilter("all", "material")}
          />
          <SummaryKpiCard
            label="Participant reports"
            value={summary.participant}
            active={kpiParticipantActive}
            onClick={() => applyKpiFilter("all", "participant")}
          />
        </div>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Report directory</CardTitle>
            <CardDescription>
              {total} report{total === 1 ? "" : "s"} matching filters
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting || loading}
            onClick={() => void handleExport()}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="report-search"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Search
              </label>
              <Input
                id="report-search"
                placeholder="Report ID, material, or participant"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="status-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  const next = e.target.value as StatusFilter;
                  setStatusFilter(next);
                  setPage(1);
                  pushFilters({ status: next });
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="target-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Target type
              </label>
              <select
                id="target-filter"
                value={targetFilter}
                onChange={(e) => {
                  const next = e.target.value as TargetFilter;
                  setTargetFilter(next);
                  setPage(1);
                  pushFilters({ targetType: next });
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All targets</option>
                <option value="material">Material</option>
                <option value="participant">Participant</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="reason-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Reason
              </label>
              <select
                id="reason-filter"
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value as ReasonFilter);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All reasons</option>
                <option value="misleading_information">Misleading information</option>
                <option value="spam">Spam</option>
                <option value="inactive_participant">Inactive participant</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="reporter-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Reporter
              </label>
              <select
                id="reporter-filter"
                value={reporterSelect}
                onChange={(e) => {
                  setReporterSelect(e.target.value);
                  setPage(1);
                  pushFilters({ reporter: e.target.value });
                }}
                className="h-9 max-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="">All reporters</option>
                {reporters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="date-from"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                From
              </label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[150px]"
              />
            </div>
            <div>
              <label
                htmlFor="date-to"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                To
              </label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[150px]"
              />
            </div>
            <div>
              <label
                htmlFor="sort-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Sort
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortFilter);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleSelectAllOnPage}
                className="h-4 w-4 rounded border-zinc-300"
                aria-label="Select all on this page"
              />
              <span className="text-xs text-zinc-500">Select all on page</span>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-zinc-50" />
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">No reports match your filters.</p>
          ) : (
            <div className="space-y-3">
              {items.map((report) => (
                <AdminReportCard
                  key={report.id}
                  report={report}
                  selected={selected.has(report.id)}
                  onToggleSelect={toggleSelect}
                  onResolve={resolveOne}
                  resolving={resolvingId === report.id}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selected.size > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:left-64">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900">
              {selected.size} report{selected.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={() => void handleExport()}
              >
                Export CSV
              </Button>
              {selectedOpenCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkResolving}
                  onClick={() => void resolveSelected()}
                >
                  {bulkResolving ? "Resolving…" : "Resolve selected"}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
