"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AdminBulkConfirmDialog } from "@/components/admin/admin-bulk-confirm-dialog";
import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { RoleBadge } from "@/components/trust/role-badge";
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
import { toBrowserMediaUrl } from "@/lib/media-url";
import {
  fetchAdminMaterialDetail,
  moderateAdminMaterial,
} from "@/services/admin/admin.service";
import type { AdminMaterialDetail } from "@/types/admin";
import type { MaterialStatus } from "@/types/material";
import {
  formatMediumDate,
  formatRelativeWhen,
} from "@/utils/format-relative-time";

type AdminMaterialDetailViewProps = {
  materialId: string;
};

const REPORT_REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

function toBadgeStatus(status: string): MaterialStatus {
  if (status === "fulfilled") return "fulfilled";
  if (status === "in_discussion") return "in_discussion";
  if (status === "archived") return "archived";
  return "available";
}

function AccountStatusBadge({ status }: { status: string }) {
  if (status === "suspended") {
    return (
      <Badge variant="destructive" className="gap-1">
        <span aria-hidden>🔴</span>
        Suspended
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <span aria-hidden>🟢</span>
      Active
    </Badge>
  );
}

export function AdminMaterialDetailView({
  materialId,
}: AdminMaterialDetailViewProps) {
  const [data, setData] = useState<AdminMaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [moderateAction, setModerateAction] = useState<"archive" | "restore" | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminMaterialDetail(materialId);
      setData(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load material");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleModerate(action: "archive" | "restore") {
    setBusy(true);
    try {
      await moderateAdminMaterial(materialId, action);
      toast.success(action === "archive" ? "Material archived" : "Material restored");
      setModerateAction(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
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
        <p className="text-sm text-red-700">{error ?? "Material not found."}</p>
        <Link
          href={ROUTES.adminMaterials}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          ← Materials
        </Link>
      </div>
    );
  }

  const { material, provider, activity, reports, reportHistory } = data;
  const isArchived = material.status === "archived";
  const hasReports = activity.reportCount > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="space-y-3">
        <Link
          href={ROUTES.adminMaterials}
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to materials
        </Link>
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {material.title}
          </h1>
          <MaterialStatusBadge status={toBadgeStatus(material.status)} />
          {hasReports ? (
            <div className="inline-flex flex-col rounded-md border-2 border-red-400 bg-red-50 px-2.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">
                ⚠ Reported
              </span>
              <span className="text-xs font-semibold text-red-800">
                {activity.reportCount} Report{activity.reportCount === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </div>
        <p className="text-sm text-zinc-500">
          {material.lotId} · Posted {formatMediumDate(material.createdAt)} ·{" "}
          {formatRelativeWhen(material.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Material information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Lot ID</dt>
                <dd className="font-mono text-sm text-zinc-900">{material.lotId}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Category</dt>
                <dd className="text-zinc-900">{material.materialType}</dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Description</dt>
                <dd className="mt-0.5 break-words text-zinc-800">
                  {material.description?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Quantity</dt>
                <dd className="text-zinc-900">
                  {material.quantity} {material.unit}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Location</dt>
                <dd className="break-words text-zinc-900">{material.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Visibility</dt>
                <dd className="capitalize text-zinc-900">{material.visibility}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Images</dt>
                <dd className="mt-2">
                  {material.imageUrls?.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {material.imageUrls.map((url) => (
                        <a
                          key={url}
                          href={toBrowserMediaUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                        >
                          <img
                            src={toBrowserMediaUrl(url)}
                            alt={material.title}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-500">No images uploaded</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-zinc-900">
                {provider.companyName}
              </p>
              <RoleBadge role={provider.role} />
              <AccountStatusBadge status={provider.accountStatus} />
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-zinc-500">Contact</dt>
                <dd className="break-words text-zinc-900">{provider.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-zinc-500">Email</dt>
                <dd className="break-all text-zinc-900">{provider.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Joined</dt>
                <dd className="text-zinc-900">
                  {formatMediumDate(provider.createdAt)} ·{" "}
                  {formatRelativeWhen(provider.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Last activity</dt>
                <dd className="text-zinc-900">
                  {formatRelativeWhen(provider.lastActivityAt)}
                </dd>
              </div>
            </dl>
            <Link
              href={ROUTES.adminParticipantDetail(provider.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View provider
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Marketplace activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Interests</p>
            <p className="text-xl font-semibold tabular-nums">{activity.interestCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Discussions</p>
            <p className="text-xl font-semibold tabular-nums">
              {activity.discussionCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Reports</p>
            <p className="text-xl font-semibold tabular-nums">{activity.reportCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Last activity</p>
            <p className="text-sm font-medium text-zinc-900">
              {formatRelativeWhen(activity.lastActivityAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.adminParticipantDetail(provider.id)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View provider
          </Link>
          <Link
            href={ROUTES.adminInterestsForMaterial(materialId)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View interests
          </Link>
          <Link
            href={ROUTES.adminDiscussionsForMaterial(materialId)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View discussions
          </Link>
          <Link
            href={ROUTES.adminReportsForMaterial(materialId)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View reports
          </Link>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Moderation</CardTitle>
          <CardDescription>Reports and listing visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Open reports
            </p>
            {reports.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No open reports.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-zinc-900">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    {r.details ? (
                      <p className="mt-1 text-zinc-600">{r.details}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatMediumDate(r.createdAt)} ·{" "}
                      {formatRelativeWhen(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Report history
            </p>
            {reportHistory.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No reports on record.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reportHistory.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-900">
                        {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                      </p>
                      <Badge
                        variant={r.status === "open" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {r.status === "open" ? "Open" : "Resolved"}
                      </Badge>
                    </div>
                    {r.details ? (
                      <p className="mt-1 text-zinc-600">{r.details}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatMediumDate(r.createdAt)} ·{" "}
                      {formatRelativeWhen(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
            <p className="text-sm text-zinc-600">
              Visibility:{" "}
              <span className="font-medium capitalize text-zinc-900">
                {material.status === "archived" ? "Archived" : "Listed"}
              </span>
            </p>
            {isArchived ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => setModerateAction("restore")}
              >
                Restore material
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setModerateAction("archive")}
              >
                Archive material
              </Button>
            )}
            {hasReports ? (
              <Link
                href={ROUTES.adminReportsForMaterial(materialId)}
                className="inline-flex h-9 items-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Review reports
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <AdminBulkConfirmDialog
        open={moderateAction !== null}
        title={
          moderateAction === "archive" ? "Archive this material?" : "Restore this material?"
        }
        body={
          moderateAction === "archive"
            ? "This material will no longer appear as an active listing on the network."
            : "This material will return to available status on the network."
        }
        confirmLabel={moderateAction === "archive" ? "Archive material" : "Restore material"}
        busy={busy}
        onConfirm={() => moderateAction && void handleModerate(moderateAction)}
        onCancel={() => setModerateAction(null)}
      />
    </div>
  );
}
