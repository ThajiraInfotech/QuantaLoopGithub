"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { AdminReportIssue } from "@/types/admin";
import { formatMediumDate, formatRelativeWhen } from "@/utils/format-relative-time";

const REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

type AdminReportCardProps = {
  report: AdminReportIssue;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onResolve: (id: string) => void;
  resolving?: boolean;
};

function targetHref(r: AdminReportIssue): string {
  if (r.targetType === "participant" && r.targetUserId) {
    return ROUTES.adminParticipantDetail(r.targetUserId);
  }
  if (r.targetType === "material" && r.targetMaterialId) {
    return ROUTES.adminMaterialDetail(r.targetMaterialId);
  }
  return ROUTES.adminReports;
}

export function AdminReportCard({
  report,
  selected,
  onToggleSelect,
  onResolve,
  resolving = false,
}: AdminReportCardProps) {
  const isOpen = report.status !== "resolved";
  const refId = report.reportRefId ?? report.id.slice(-8).toUpperCase();

  return (
    <article className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5">
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(report.id)}
          className="mt-1 h-4 w-4 rounded border-zinc-300"
          aria-label={`Select report ${refId}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-semibold text-zinc-900">
              {refId.startsWith("RPT-") ? refId : `RPT-${refId}`}
            </h2>
            <Badge variant={isOpen ? "destructive" : "secondary"}>
              {isOpen ? "Open" : "Resolved"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {report.targetType}
            </Badge>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Reason</dt>
              <dd className="font-medium text-zinc-900">
                {REASON_LABELS[report.reason] ?? report.reason}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Reporter</dt>
              <dd className="break-words text-zinc-900">
                {report.reporterCompany ?? "—"}
              </dd>
              {report.reporterName ? (
                <p className="text-xs text-zinc-500">{report.reporterName}</p>
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Target</dt>
              <dd className="break-words font-medium text-zinc-900">
                {report.targetLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Created</dt>
              <dd className="text-zinc-900">{formatMediumDate(report.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last updated</dt>
              <dd className="text-zinc-900">
                {report.updatedAt
                  ? formatRelativeWhen(report.updatedAt)
                  : formatRelativeWhen(report.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Resolution</dt>
              <dd className="text-zinc-900">
                {isOpen
                  ? "Awaiting review"
                  : report.resolvedAt
                    ? `Resolved ${formatRelativeWhen(report.resolvedAt)}`
                    : "Resolved"}
              </dd>
            </div>
          </dl>

          {report.details ? (
            <p className="line-clamp-2 text-sm text-zinc-600">{report.details}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={ROUTES.adminReportDetail(report.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View report
            </Link>
            <Link
              href={targetHref(report)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Open {report.targetType}
            </Link>
            {isOpen ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resolving}
                onClick={() => onResolve(report.id)}
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
