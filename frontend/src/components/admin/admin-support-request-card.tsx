"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { AdminSupportRequestIssue } from "@/types/admin";
import { formatMediumDate, formatRelativeWhen } from "@/utils/format-relative-time";

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: "Onboarding & access",
  matching: "Materials & matching",
  billing: "Billing & membership",
  technical: "Technical issue",
  other: "Other",
};

const SOURCE_LABELS: Record<string, string> = {
  public: "Public site",
  onboarding: "Onboarding",
  dashboard: "Dashboard",
};

type AdminSupportRequestCardProps = {
  request: AdminSupportRequestIssue;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onResolve: (id: string) => void;
  resolving?: boolean;
};

export function AdminSupportRequestCard({
  request,
  selected,
  onToggleSelect,
  onResolve,
  resolving = false,
}: AdminSupportRequestCardProps) {
  const isOpen = request.status !== "resolved";
  const refId =
    request.supportRefId ?? `SUP-${request.id.slice(-8).toUpperCase()}`;

  return (
    <article className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5">
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(request.id)}
          className="mt-1 h-4 w-4 rounded border-zinc-300"
          aria-label={`Select support request ${refId}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-semibold text-zinc-900">
              {refId}
            </h2>
            <Badge variant={isOpen ? "destructive" : "secondary"}>
              {isOpen ? "Open" : "Resolved"}
            </Badge>
            <Badge variant="outline">
              {CATEGORY_LABELS[request.category] ?? request.category}
            </Badge>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">From</dt>
              <dd className="font-medium text-zinc-900">{request.name}</dd>
              <p className="break-all text-xs text-zinc-500">{request.email}</p>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Company</dt>
              <dd className="break-words text-zinc-900">
                {request.companyName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Source</dt>
              <dd className="text-zinc-900">
                {SOURCE_LABELS[request.source] ?? request.source}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Created</dt>
              <dd className="text-zinc-900">
                {formatMediumDate(request.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last updated</dt>
              <dd className="text-zinc-900">
                {request.updatedAt
                  ? formatRelativeWhen(request.updatedAt)
                  : formatRelativeWhen(request.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Resolution</dt>
              <dd className="text-zinc-900">
                {isOpen
                  ? "Awaiting review"
                  : request.resolvedAt
                    ? `Resolved ${formatRelativeWhen(request.resolvedAt)}`
                    : "Resolved"}
              </dd>
            </div>
          </dl>

          {request.description ? (
            <p className="line-clamp-2 text-sm text-zinc-600">
              {request.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={ROUTES.adminSupportDetail(request.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View request
            </Link>
            {isOpen ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resolving}
                onClick={() => onResolve(request.id)}
              >
                Resolve
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
