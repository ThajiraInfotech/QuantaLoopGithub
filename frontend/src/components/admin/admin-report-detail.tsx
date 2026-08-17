"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { fetchAdminReportDetail } from "@/services/admin/admin.service";
import { resolveReportRequest } from "@/services/reports/report.service";
import type { AdminReportDetail } from "@/types/admin";
import {
  formatMediumDate,
  formatRelativeWhen,
} from "@/utils/format-relative-time";

const REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

type AdminReportDetailViewProps = {
  reportId: string;
};

export function AdminReportDetailView({ reportId }: AdminReportDetailViewProps) {
  const [data, setData] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminReportDetail(reportId);
      setData(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load report");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResolve() {
    setResolving(true);
    try {
      await resolveReportRequest(reportId);
      toast.success("Report marked resolved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resolve failed");
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 py-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-48 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <p className="text-sm text-red-700">{error ?? "Report not found."}</p>
        <Link
          href={ROUTES.adminReports}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          ← Reports
        </Link>
      </div>
    );
  }

  const { report, reporter, target, resolution, history } = data;
  const isOpen = report.status !== "resolved";
  const refId = report.reportRefId ?? `RPT-${report.id.slice(-8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="space-y-3">
        <Link
          href={ROUTES.adminReports}
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to reports
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-zinc-900">
              {refId}
            </h1>
            <Badge variant={isOpen ? "destructive" : "secondary"}>
              {isOpen ? "Open" : "Resolved"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {report.targetType}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {target?.type === "material" ? (
              <Link
                href={ROUTES.adminMaterialDetail(target.id)}
                className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View material
              </Link>
            ) : null}
            {target?.type === "participant" ? (
              <Link
                href={ROUTES.adminParticipantDetail(target.id)}
                className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View participant
              </Link>
            ) : null}
            {target?.type === "material" && target.provider ? (
              <Link
                href={ROUTES.adminParticipantDetail(target.provider.id)}
                className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View provider
              </Link>
            ) : null}
            {isOpen ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resolving}
                onClick={() => void handleResolve()}
              >
                {resolving ? "Resolving…" : "Resolve report"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Report information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Report ID</dt>
              <dd className="font-mono text-zinc-900">{refId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Reason</dt>
              <dd className="font-medium text-zinc-900">
                {REASON_LABELS[report.reason] ?? report.reason}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Target type</dt>
              <dd className="capitalize text-zinc-900">{report.targetType}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Created</dt>
              <dd className="text-zinc-900">
                {formatMediumDate(report.createdAt)} ·{" "}
                {formatRelativeWhen(report.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last updated</dt>
              <dd className="text-zinc-900">
                {report.updatedAt
                  ? formatRelativeWhen(report.updatedAt)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Status</dt>
              <dd className="capitalize text-zinc-900">{resolution.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {reporter ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reporter information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-900">{reporter.companyName}</p>
            <p className="text-zinc-700">{reporter.name}</p>
            <p className="text-xs text-zinc-500">{reporter.email}</p>
            <p className="text-xs capitalize text-zinc-500">{reporter.role}</p>
            <Link
              href={ROUTES.adminParticipantDetail(reporter.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View reporter profile
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {target ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Target information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {target.type === "participant" ? (
              <>
                <p className="font-semibold text-zinc-900">{target.companyName}</p>
                <p className="text-zinc-700">{target.name}</p>
                <p className="text-xs text-zinc-500">{target.email}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-zinc-900">{target.title}</p>
                <p className="text-xs text-zinc-500">
                  {target.lotId} · {target.materialType} · {target.location}
                </p>
                <p className="text-zinc-700">
                  {target.quantity} {target.unit}
                </p>
                {target.provider ? (
                  <p className="text-xs text-zinc-500">
                    Provider: {target.provider.companyName}
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evidence / details</CardTitle>
        </CardHeader>
        <CardContent>
          {report.details ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {report.details}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">No additional details provided.</p>
          )}
        </CardContent>
      </Card>

      {target ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Related material or participant</CardTitle>
            <CardDescription>Quick links to the reported entity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {target.type === "material" ? (
              <>
                <Link
                  href={ROUTES.adminMaterialDetail(target.id)}
                  className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  View material
                </Link>
                {target.provider ? (
                  <Link
                    href={ROUTES.adminParticipantDetail(target.provider.id)}
                    className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    View provider
                  </Link>
                ) : null}
              </>
            ) : (
              <Link
                href={ROUTES.adminParticipantDetail(target.id)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View participant
              </Link>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resolution history</CardTitle>
          <CardDescription>Moderation timeline for this report</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-0 border-l border-zinc-200 pl-4">
            {history.map((event, idx) => (
              <li
                key={`${event.type}-${idx}`}
                className="relative pb-4 last:pb-0"
              >
                <span
                  className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400 ring-1 ring-zinc-200"
                  aria-hidden
                />
                <p className="text-sm font-medium text-zinc-900">{event.label}</p>
                {event.detail ? (
                  <p className="mt-0.5 text-sm text-zinc-700">{event.detail}</p>
                ) : null}
                <p className="mt-1 text-xs text-zinc-500">
                  {formatMediumDate(event.occurredAt)}
                  <span className="mx-1 text-zinc-300">·</span>
                  {formatRelativeWhen(event.occurredAt)}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
