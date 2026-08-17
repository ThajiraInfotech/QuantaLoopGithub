"use client";

import Link from "next/link";

import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import type { AdminMaterialRow } from "@/types/admin";
import type { AccountStatus } from "@/types/admin";
import type { MaterialStatus } from "@/types/material";
import { formatMediumDate, formatRelativeWhen } from "@/utils/format-relative-time";

type AdminMaterialCardProps = {
  material: AdminMaterialRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

function toBadgeStatus(status: string): MaterialStatus {
  if (status === "fulfilled") return "fulfilled";
  if (status === "in_discussion") return "in_discussion";
  if (status === "archived") return "archived";
  return "available";
}

function ProviderAccountBadge({ status }: { status: AccountStatus }) {
  if (status === "suspended") {
    return (
      <Badge variant="destructive" className="mt-1 gap-1">
        <span aria-hidden>🔴</span>
        Suspended
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="mt-1 gap-1">
      <span aria-hidden>🟢</span>
      Active
    </Badge>
  );
}

function ReportedBadge({ count }: { count: number }) {
  return (
    <div
      className="inline-flex flex-col rounded-md border-2 border-red-400 bg-red-50 px-2.5 py-1"
      role="status"
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">
        ⚠ Reported
      </span>
      <span className="text-xs font-semibold text-red-800">
        {count} Report{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function AdminMaterialCard({
  material,
  selected,
  onToggleSelect,
}: AdminMaterialCardProps) {
  const providerId = material.provider?.id;
  const reported = material.reportCount > 0;

  return (
    <article
      className={
        reported
          ? "rounded-xl border-2 border-red-300 bg-red-50/30 p-4 shadow-sm shadow-red-950/5"
          : "rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5"
      }
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(material.id)}
          className="mt-1 h-4 w-4 rounded border-zinc-300"
          aria-label={`Select ${material.title}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900">
                  {material.title}
                </h2>
                {reported ? <ReportedBadge count={material.reportCount} /> : null}
                <MaterialStatusBadge status={toBadgeStatus(material.status)} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {material.lotId} · {material.materialType}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Provider</dt>
              <dd className="break-words text-zinc-900">
                {material.provider?.companyName ?? "—"}
              </dd>
              {material.provider?.accountStatus ? (
                <ProviderAccountBadge status={material.provider.accountStatus} />
              ) : null}
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
              <dt className="text-xs font-medium text-zinc-500">Posted</dt>
              <dd className="text-zinc-900">
                {formatMediumDate(material.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Interests</dt>
              <dd className="font-medium tabular-nums text-zinc-900">
                {material.interestCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Reports</dt>
              <dd
                className={
                  reported
                    ? "font-semibold tabular-nums text-red-700"
                    : "font-medium tabular-nums text-zinc-900"
                }
              >
                {material.reportCount}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <dt className="text-xs font-medium text-zinc-500">Last activity</dt>
              <dd className="text-zinc-900">
                {formatRelativeWhen(material.lastActivityAt)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={ROUTES.adminMaterialDetail(material.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View material
            </Link>
            {providerId ? (
              <Link
                href={ROUTES.adminParticipantDetail(providerId)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View provider
              </Link>
            ) : null}
            <Link
              href={ROUTES.adminInterestsForMaterial(material.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View interests
            </Link>
            {reported ? (
              <Link
                href={ROUTES.adminReportsForMaterial(material.id)}
                className="inline-flex h-8 items-center rounded-md border border-red-300 bg-red-100 px-3 text-xs font-semibold text-red-800 hover:bg-red-200"
              >
                Review reports
              </Link>
            ) : (
              <Link
                href={ROUTES.adminReportsForMaterial(material.id)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View reports
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
