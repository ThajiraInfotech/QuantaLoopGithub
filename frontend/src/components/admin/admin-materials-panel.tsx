"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AdminBulkConfirmDialog } from "@/components/admin/admin-bulk-confirm-dialog";
import { AdminMaterialCard } from "@/components/admin/admin-material-card";
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
  bulkModerateAdminMaterials,
  fetchAdminMaterials,
  fetchAllAdminMaterials,
} from "@/services/admin/admin.service";
import type { AdminMaterialRow, AdminMaterialSummary } from "@/types/admin";
import type { AdminMaterialProviderOption } from "@/types/admin";
import { formatMediumDate } from "@/utils/format-relative-time";

const SEARCH_DEBOUNCE_MS = 400;

type StatusFilter =
  | "all"
  | "available"
  | "in_discussion"
  | "completed"
  | "archived";

type SortFilter = "newest" | "oldest" | "most_interests" | "most_reports";

type BulkAction = "archive" | "restore" | "export" | null;

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
          <p className="text-3xl font-semibold tabular-nums text-zinc-900">
            {value}
          </p>
        </CardContent>
      </Card>
    </button>
  );
}

function downloadMaterialsCsv(rows: AdminMaterialRow[]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const header = [
    "Title",
    "Lot ID",
    "Provider",
    "Category",
    "Quantity",
    "Unit",
    "Location",
    "Status",
    "Interests",
    "Reports",
    "Posted",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.title,
        row.lotId,
        row.provider?.companyName ?? "",
        row.materialType,
        String(row.quantity),
        row.unit,
        row.location,
        row.status,
        String(row.interestCount),
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
  anchor.download = `materials-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminMaterialsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantFilter = searchParams.get("participant");

  const [items, setItems] = useState<AdminMaterialRow[]>([]);
  const [summary, setSummary] = useState<AdminMaterialSummary | null>(null);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [providers, setProviders] = useState<AdminMaterialProviderOption[]>([]);
  const [providerSearch, setProviderSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [materialTypeFilter, setMaterialTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [sort, setSort] = useState<SortFilter>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);

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
      const result = await fetchAdminMaterials({
        search,
        status: statusFilter,
        materialType: materialTypeFilter,
        location: locationFilter,
        reportedOnly,
        participant: participantFilter ?? undefined,
        sort,
        page,
        limit: 20,
      });
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary);
      setMaterialTypes(result.materialTypes);
      setProviders(result.providers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load materials");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    materialTypeFilter,
    locationFilter,
    reportedOnly,
    participantFilter,
    sort,
    page,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  function setProviderFilter(providerId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (providerId) {
      params.set("participant", providerId);
    } else {
      params.delete("participant");
    }
    setPage(1);
    router.push(
      params.toString()
        ? `${ROUTES.adminMaterials}?${params.toString()}`
        : ROUTES.adminMaterials
    );
  }

  function toggleSelectAllOnPage() {
    const pageIds = items.map((i) => i.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [providers, providerSearch]);

  const selectedProviderLabel = useMemo(() => {
    if (!participantFilter) return null;
    return providers.find((p) => p.id === participantFilter)?.companyName ?? null;
  }, [participantFilter, providers]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyKpiFilter(
    nextStatus: StatusFilter,
    nextReportedOnly: boolean
  ) {
    setPage(1);
    setStatusFilter(nextStatus);
    setReportedOnly(nextReportedOnly);
  }

  async function handleBulkConfirm() {
    if (!bulkAction) return;

    if (bulkAction === "export") {
      setExporting(true);
      try {
        const rows =
          selected.size > 0
            ? items.filter((i) => selected.has(i.id))
            : await fetchAllAdminMaterials({
                search,
                status: statusFilter,
                materialType: materialTypeFilter,
                location: locationFilter,
                reportedOnly,
                participant: participantFilter ?? undefined,
                sort,
              });
        if (rows.length === 0) {
          toast.error("No materials to export");
          return;
        }
        downloadMaterialsCsv(rows);
        toast.success(`Exported ${rows.length} material${rows.length === 1 ? "" : "s"}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed");
      } finally {
        setExporting(false);
        setBulkAction(null);
      }
      return;
    }

    const ids = [...selected];
    if (!ids.length) return;

    setBusy(true);
    try {
      const result = await bulkModerateAdminMaterials(ids, bulkAction);
      toast.success(
        bulkAction === "archive"
          ? `Archived ${result.updated} material${result.updated === 1 ? "" : "s"}`
          : `Restored ${result.updated} material${result.updated === 1 ? "" : "s"}`
      );
      setBulkAction(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const kpiTotalActive =
    statusFilter === "all" && !reportedOnly && !participantFilter;
  const kpiAvailableActive = statusFilter === "available" && !reportedOnly;
  const kpiDiscussionActive =
    statusFilter === "in_discussion" && !reportedOnly;
  const kpiCompletedActive = statusFilter === "completed" && !reportedOnly;
  const kpiReportedActive = reportedOnly;
  const allOnPageSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));

  const bulkTitle =
    bulkAction === "archive"
      ? "Archive selected materials?"
      : bulkAction === "restore"
        ? "Restore selected materials?"
        : "Export materials?";

  const bulkBody =
    bulkAction === "archive"
      ? "Archived materials will no longer appear as active listings on the network."
      : bulkAction === "restore"
        ? "Restored materials will return to available status on the network."
        : selected.size > 0
          ? `Export ${selected.size} selected material${selected.size === 1 ? "" : "s"} to CSV.`
          : "Export all materials matching current filters to CSV.";

  const bulkConfirmLabel =
    bulkAction === "archive"
      ? "Archive materials"
      : bulkAction === "restore"
        ? "Restore materials"
        : "Export CSV";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Materials
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Monitor and manage material listings across the platform.
        </p>
        {participantFilter ? (
          <Link
            href={ROUTES.adminMaterials}
            className="mt-2 inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← All materials
          </Link>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryKpiCard
            label="Total materials"
            value={summary.total}
            active={kpiTotalActive}
            onClick={() => applyKpiFilter("all", false)}
          />
          <SummaryKpiCard
            label="Available"
            value={summary.available}
            active={kpiAvailableActive}
            onClick={() => applyKpiFilter("available", false)}
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
            label="Reported materials"
            value={summary.reported}
            active={kpiReportedActive}
            onClick={() => applyKpiFilter("all", true)}
          />
        </div>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Material Directory</CardTitle>
            <CardDescription>
              {total} material{total === 1 ? "" : "s"} across the network
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting || loading}
            onClick={() => setBulkAction("export")}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="material-search"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Search
              </label>
              <Input
                id="material-search"
                placeholder="Material name, lot ID, or company"
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
                  setPage(1);
                  setStatusFilter(e.target.value as StatusFilter);
                }}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="in_discussion">In discussion</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
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
            <div className="min-w-[180px]">
              <label
                htmlFor="provider-filter"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Provider
              </label>
              <Input
                id="provider-search"
                placeholder="Search providers…"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="mb-1 h-8"
              />
              <select
                id="provider-filter"
                value={participantFilter ?? ""}
                onChange={(e) =>
                  setProviderFilter(e.target.value || null)
                }
                className="h-9 w-full max-w-[220px] rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="">All providers</option>
                {filteredProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName}
                  </option>
                ))}
              </select>
              {selectedProviderLabel ? (
                <button
                  type="button"
                  onClick={() => setProviderFilter(null)}
                  className="mt-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Clear provider filter
                </button>
              ) : null}
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
                <option value="most_interests">Most interests</option>
                <option value="most_reports">Most reports</option>
              </select>
            </div>
            <label className="flex h-9 items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={reportedOnly}
                onChange={(e) => {
                  setPage(1);
                  setReportedOnly(e.target.checked);
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
            <p className="text-sm text-zinc-500">No materials match your filters.</p>
          ) : (
            <div className="space-y-3">
              {items.map((material) => (
                <AdminMaterialCard
                  key={material.id}
                  material={material}
                  selected={selected.has(material.id)}
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
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900">
              {selected.size} material{selected.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("archive")}
              >
                Archive
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("restore")}
              >
                Restore
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("export")}
              >
                Export CSV
              </Button>
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

      <AdminBulkConfirmDialog
        open={bulkAction !== null}
        title={bulkTitle}
        body={bulkBody}
        confirmLabel={bulkConfirmLabel}
        busy={busy || exporting}
        onConfirm={() => void handleBulkConfirm()}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}
