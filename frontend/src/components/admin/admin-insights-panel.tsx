"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

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
  deleteAdminInsight,
  fetchAdminInsights,
} from "@/services/content-insights/content-insight.service";
import type {
  ContentInsight,
  ContentInsightLanguage,
  ContentInsightStatus,
} from "@/types/content-insight";

const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = ContentInsightStatus | "all";
type LanguageFilter = ContentInsightLanguage | "all";

function statusBadgeClass(status: ContentInsightStatus) {
  if (status === "published") return "bg-emerald-50 text-emerald-800";
  if (status === "draft") return "bg-amber-50 text-amber-800";
  return "bg-zinc-100 text-zinc-600";
}

export function AdminInsightsPanel() {
  const [items, setItems] = useState<ContentInsight[]>([]);
  const [summary, setSummary] = useState({
    published: 0,
    draft: 0,
    archived: 0,
    total: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminInsights({
        search,
        status: statusFilter,
        language: languageFilter,
        page,
        limit: 20,
      });
      setItems(result.insights);
      setTotal(result.total);
      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [search, statusFilter, languageFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string, title: string) {
    if (!window.confirm(`Delete insight “${title}”? This cannot be undone.`)) {
      return;
    }

    const previousItems = items;
    const previousSummary = summary;
    const previousTotal = total;
    const removed = items.find((item) => item.id === id);

    // Optimistic UI — remove instantly.
    setItems((prev) => prev.filter((item) => item.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (removed) {
      setSummary((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        published:
          removed.status === "published"
            ? Math.max(0, prev.published - 1)
            : prev.published,
        draft:
          removed.status === "draft"
            ? Math.max(0, prev.draft - 1)
            : prev.draft,
        archived:
          removed.status === "archived"
            ? Math.max(0, prev.archived - 1)
            : prev.archived,
      }));
    }

    setDeletingId(id);
    try {
      await deleteAdminInsight(id);
      toast.success("Insight deleted");
      startTransition(() => {
        void fetch("/api/revalidate-insights", { method: "POST" }).catch(
          () => undefined
        );
      });
      // Soft sync counts in background without full-page spinner.
      void load({ silent: true });
    } catch (e) {
      setItems(previousItems);
      setSummary(previousSummary);
      setTotal(previousTotal);
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Public Insights
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Create guides for{" "}
            <Link
              href={ROUTES.publicInsights}
              className="font-medium text-zinc-900 underline underline-offset-2"
              target="_blank"
            >
              /insights
            </Link>
            . Publish makes them live immediately.
          </p>
        </div>
        <Link
          href={ROUTES.adminInsightNew}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New insight
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {summary.published}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{summary.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {summary.archived}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, slug, tags"
            className="sm:max-w-xs"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value as LanguageFilter);
              setPage(1);
            }}
          >
            <option value="all">All languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
          </select>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-zinc-600">
            No insights yet. Create your first public guide.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-400">
                        {item.language}
                      </span>
                    </div>
                    <h2 className="mt-2 font-heading text-lg font-semibold text-zinc-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      /insights/{item.slug}
                      {item.publishedAt
                        ? ` · published ${item.publishedAt.slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={ROUTES.adminInsightEdit(item.id)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                    >
                      Edit
                    </Link>
                    {item.status === "published" ? (
                      <Link
                        href={ROUTES.publicInsight(item.slug)}
                        target="_blank"
                        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                      >
                        View live
                      </Link>
                    ) : null}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => void onDelete(item.id, item.title)}
                    >
                      {deletingId === item.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-zinc-600">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
