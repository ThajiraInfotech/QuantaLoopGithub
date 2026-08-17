"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AdminInterestCard } from "@/components/admin/admin-interest-card";
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
  fetchAdminInterests,
  fetchAllAdminInterests,
} from "@/services/admin/admin.service";
import type { AdminInterestRow, AdminInterestSummary } from "@/types/admin";
import type { AdminInterestParticipantBrief } from "@/types/admin";
import { formatMediumDate } from "@/utils/format-relative-time";

const SEARCH_DEBOUNCE_MS = 400;

type StatusFilter = "all" | "pending" | "in_discussion" | "completed";
type SortFilter = "newest" | "oldest" | "most_messages" | "most_reports";

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

function downloadInterestsCsv(rows: AdminInterestRow[]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const header = [
    "Interest ID",
    "Status",
    "Buyer",
    "Provider",
    "Material",
    "Lot ID",
    "Category",
    "Messages",
    "Reports",
    "Created",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.interestRefId,
        row.status,
        row.buyer?.companyName ?? "",
        row.provider?.companyName ?? "",
        row.material?.title ?? "",
        row.material?.lotId ?? "",
        row.material?.materialType ?? "",
        String(row.messageCount),
        String(row.reportCount),
        formatMediumDate(row.createdAt),
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `interests-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ParticipantSelect({
  label,
  id,
  value,
  options,
  search,
  onSearchChange,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  options: AdminInterestParticipantBrief[];
  search: string;
  onSearchChange: (v: string) => void;
  onChange: (v: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [options, search]);

  return (
    <div className="min-w-[160px]">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-zinc-600">
        {label}
      </label>
      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-1 h-8"
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full max-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm"
      >
        <option value="">All</option>
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.companyName}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminInterestsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantFilter = searchParams.get("participant");
  const materialFilter = searchParams.get("material");
  const scopeFilter = searchParams.get("scope") as
    | "created"
    | "received"
    | "completed"
    | null;
  const initialStatus = searchParams.get("status");
  const initialReportedOnly = searchParams.get("reportedOnly") === "true";

  const [items, setItems] = useState<AdminInterestRow[]>([]);
  const [summary, setSummary] = useState<AdminInterestSummary | null>(null);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [buyers, setBuyers] = useState<AdminInterestParticipantBrief[]>([]);
  const [providers, setProviders] = useState<AdminInterestParticipantBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    if (
      initialStatus === "pending" ||
      initialStatus === "in_discussion" ||
      initialStatus === "completed"
    ) {
      return initialStatus;
    }
    return "all";
  });
  const [materialTypeFilter, setMaterialTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [reportedOnly, setReportedOnly] = useState(initialReportedOnly);
  const [sort, setSort] = useState<SortFilter>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminInterests({
        search,
        status: statusFilter,
        participant: participantFilter ?? undefined,
        scope: scopeFilter ?? undefined,
        material: materialFilter ?? undefined,
        buyer: buyerFilter || undefined,
        provider: providerFilter || undefined,
        materialType: materialTypeFilter,
        location: locationFilter,
        reportedOnly,
        sort,
        page,
        limit: 20,
      });
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary);
      setMaterialTypes(result.materialTypes);
      setBuyers(result.buyers);
      setProviders(result.providers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load interests");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    participantFilter,
    scopeFilter,
    materialFilter,
    buyerFilter,
    providerFilter,
    materialTypeFilter,
    locationFilter,
    reportedOnly,
    sort,
    page,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  function pushListFilters(nextStatus: StatusFilter, nextReportedOnly: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextReportedOnly) {
      params.set("reportedOnly", "true");
      params.delete("status");
    } else {
      params.delete("reportedOnly");
      if (nextStatus === "all") {
        params.delete("status");
      } else {
        params.set("status", nextStatus);
      }
    }
    router.push(
      params.toString()
        ? `${ROUTES.adminInterests}?${params.toString()}`
        : ROUTES.adminInterests,
      { scroll: false }
    );
  }

  useEffect(() => {
    const urlReported = searchParams.get("reportedOnly") === "true";
    const urlStatus = searchParams.get("status");
    setReportedOnly(urlReported);
    if (urlReported) {
      setStatusFilter("all");
      return;
    }
    if (
      urlStatus === "pending" ||
      urlStatus === "in_discussion" ||
      urlStatus === "completed"
    ) {
      setStatusFilter(urlStatus);
    } else {
      setStatusFilter("all");
    }
  }, [searchParams]);

  function setParticipantUrlFilter(providerId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (providerId) params.set("participant", providerId);
    else params.delete("participant");
    setPage(1);
    router.push(
      params.toString()
        ? `${ROUTES.adminInterests}?${params.toString()}`
        : ROUTES.adminInterests
    );
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

  function applyKpiFilter(nextStatus: StatusFilter, nextReportedOnly: boolean) {
    setPage(1);
    setStatusFilter(nextReportedOnly ? "all" : nextStatus);
    setReportedOnly(nextReportedOnly);
    pushListFilters(nextReportedOnly ? "all" : nextStatus, nextReportedOnly);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows =
        selected.size > 0
          ? items.filter((i) => selected.has(i.id))
          : await fetchAllAdminInterests({
              search,
              status: statusFilter,
              participant: participantFilter ?? undefined,
              scope: scopeFilter ?? undefined,
              material: materialFilter ?? undefined,
              buyer: buyerFilter || undefined,
              provider: providerFilter || undefined,
              materialType: materialTypeFilter,
              location: locationFilter,
              reportedOnly,
              sort,
            });
      if (rows.length === 0) {
        toast.error("No interests to export");
        return;
      }
      downloadInterestsCsv(rows);
      toast.success(`Exported ${rows.length} interest${rows.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const kpiTotalActive =
    statusFilter === "all" &&
    !reportedOnly &&
    !participantFilter &&
    !materialFilter &&
    !buyerFilter &&
    !providerFilter;
  const kpiPendingActive = statusFilter === "pending" && !reportedOnly;
  const kpiDiscussionActive = statusFilter === "in_discussion" && !reportedOnly;
  const kpiCompletedActive = statusFilter === "completed" && !reportedOnly;
  const kpiReportedActive = reportedOnly;
  const allOnPageSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));

  const selectedWithReports = items.filter(
    (i) => selected.has(i.id) && i.reportCount > 0
  );
  const reviewReportsHref =
    selectedWithReports.length === 1
      ? ROUTES.adminReportsForInterest(selectedWithReports[0].id)
      : ROUTES.adminReports;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Interests
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Monitor buyer engagement and marketplace activity across the platform.
        </p>
        {participantFilter || materialFilter || scopeFilter ? (
          <div className="mt-2 space-y-1">
            {scopeFilter ? (
              <p className="text-sm text-zinc-500">
                Showing{" "}
                {scopeFilter === "created"
                  ? "interests created"
                  : scopeFilter === "received"
                    ? "interests received"
                    : "completed deals"}{" "}
                for this participant
              </p>
            ) : null}
            <Link
              href={ROUTES.adminInterests}
              className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← All interests
            </Link>
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryKpiCard
            label="Total interests"
            value={summary.total}
            active={kpiTotalActive}
            onClick={() => applyKpiFilter("all", false)}
          />
          <SummaryKpiCard
            label="Pending"
            value={summary.pending}
            active={kpiPendingActive}
            onClick={() => applyKpiFilter("pending", false)}
          />
          <SummaryKpiCard
            label="In discussion"
            value={summary.inDiscussion}
            active={kpiDiscussionActive}
            onClick={() => applyKpiFilter("in_discussion", false)}
          />
          <SummaryKpiCard
            label="Completed"
            value={summary.completed}
            active={kpiCompletedActive}
            onClick={() => applyKpiFilter("completed", false)}
          />
          <SummaryKpiCard
            label="Reported"
            value={summary.reported}
            active={kpiReportedActive}
            onClick={() => applyKpiFilter("all", true)}
          />
        </div>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Interest Directory</CardTitle>
            <CardDescription>
              {total} interest{total === 1 ? "" : "s"} across the platform
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
                htmlFor="interest-search"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Search
              </label>
              <Input
                id="interest-search"
                placeholder="Interest ID, company, or material"
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
                  setPage(1);
                  setStatusFilter(next);
                  setReportedOnly(false);
                  pushListFilters(next, false);
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_discussion">In discussion</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <ParticipantSelect
              label="Buyer"
              id="buyer-filter"
              value={buyerFilter}
              options={buyers}
              search={buyerSearch}
              onSearchChange={setBuyerSearch}
              onChange={(v) => {
                setPage(1);
                setBuyerFilter(v);
              }}
            />
            <ParticipantSelect
              label="Provider"
              id="provider-filter"
              value={providerFilter || participantFilter || ""}
              options={providers}
              search={providerSearch}
              onSearchChange={setProviderSearch}
              onChange={(v) => {
                setBuyerFilter("");
                setProviderFilter(v);
                setParticipantUrlFilter(v || null);
              }}
            />
            <div>
              <label
                htmlFor="category-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Material category
              </label>
              <select
                id="category-filter"
                value={materialTypeFilter}
                onChange={(e) => {
                  setPage(1);
                  setMaterialTypeFilter(e.target.value);
                }}
                className="h-9 max-w-[180px] rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All categories</option>
                {materialTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="location-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Location
              </label>
              <Input
                id="location-filter"
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => {
                  setPage(1);
                  setLocationFilter(e.target.value);
                }}
                className="h-9 w-[160px]"
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
                  setPage(1);
                  setSort(e.target.value as SortFilter);
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_messages">Most messages</option>
                <option value="most_reports">Most reports</option>
              </select>
            </div>
            <label className="flex h-9 items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={reportedOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPage(1);
                  setReportedOnly(checked);
                  if (checked) setStatusFilter("all");
                  pushListFilters(checked ? "all" : statusFilter, checked);
                }}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Reported only
            </label>
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
            <p className="text-sm text-zinc-500">No interests match your filters.</p>
          ) : (
            <div className="space-y-3">
              {items.map((interest) => (
                <AdminInterestCard
                  key={interest.id}
                  interest={interest}
                  selected={selected.has(interest.id)}
                  onToggleSelect={toggleSelect}
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
              {selected.size} interest{selected.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={() => void handleExport()}
              >
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
              <Link
                href={reviewReportsHref}
                className={
                  selectedWithReports.length > 0
                    ? "inline-flex h-9 items-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 hover:bg-red-100"
                    : "inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                }
              >
                Review reports
              </Link>
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
