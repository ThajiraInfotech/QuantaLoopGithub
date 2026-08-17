"use client";

import Link from "next/link";

import { InterestStatusBadge } from "@/components/interests/interest-status-badge";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import type { AdminInterestRow } from "@/types/admin";
import type { AccountStatus } from "@/types/admin";
import type { InterestStatus } from "@/types/interest";
import { formatMediumDate, formatRelativeWhen } from "@/utils/format-relative-time";

type AdminInterestCardProps = {
  interest: AdminInterestRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
};

function AccountStatusBadge({ status }: { status: AccountStatus }) {
  if (status === "suspended") {
    return (
      <Badge variant="destructive" className="mt-0.5 gap-1 text-[10px]">
        <span aria-hidden>🔴</span>
        Suspended
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="mt-0.5 gap-1 text-[10px]">
      <span aria-hidden>🟢</span>
      Active
    </Badge>
  );
}

function ReportedBadge({ count }: { count: number }) {
  return (
    <div className="inline-flex flex-col rounded-md border-2 border-red-400 bg-red-50 px-2.5 py-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">
        ⚠ Reported
      </span>
      <span className="text-xs font-semibold text-red-800">
        {count} Open Report{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function AdminInterestCard({
  interest,
  selected,
  onToggleSelect,
}: AdminInterestCardProps) {
  const reported = interest.reportCount > 0;
  const status = interest.status as InterestStatus;

  return (
    <article
      className={
        reported
          ? "rounded-xl border-2 border-red-300 bg-red-50/30 p-4 shadow-sm"
          : "rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5"
      }
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(interest.id)}
          className="mt-1 h-4 w-4 rounded border-zinc-300"
          aria-label={`Select interest ${interest.interestRefId}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-semibold text-zinc-900">
              {interest.interestRefId}
            </h2>
            <InterestStatusBadge status={status} />
            {reported ? <ReportedBadge count={interest.reportCount} /> : null}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Buyer</dt>
              <dd className="break-words font-medium text-zinc-900">
                {interest.buyer?.companyName ?? "—"}
              </dd>
              {interest.buyer?.accountStatus ? (
                <AccountStatusBadge status={interest.buyer.accountStatus} />
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Provider</dt>
              <dd className="break-words font-medium text-zinc-900">
                {interest.provider?.companyName ?? "—"}
              </dd>
              {interest.provider?.accountStatus ? (
                <AccountStatusBadge status={interest.provider.accountStatus} />
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Material</dt>
              <dd className="break-words text-zinc-900">
                {interest.material?.title ?? "—"}
              </dd>
              {interest.material ? (
                <p className="text-xs text-zinc-500">
                  {interest.material.lotId} · {interest.material.materialType}
                </p>
              ) : null}
            </div>
          </dl>

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Created</dt>
              <dd className="text-zinc-900">
                {formatMediumDate(interest.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Messages</dt>
              <dd className="font-medium tabular-nums text-zinc-900">
                {interest.messageCount}
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
                {interest.reportCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last Activity</dt>
              <dd className="font-medium text-zinc-900">
                {formatRelativeWhen(interest.lastActivityAt)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={ROUTES.adminInterestDetail(interest.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View interest
            </Link>
            {interest.material?.id ? (
              <Link
                href={ROUTES.adminMaterialDetail(interest.material.id)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View material
              </Link>
            ) : null}
            {interest.buyer?.id ? (
              <Link
                href={ROUTES.adminParticipantDetail(interest.buyer.id)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View buyer
              </Link>
            ) : null}
            {interest.provider?.id ? (
              <Link
                href={ROUTES.adminParticipantDetail(interest.provider.id)}
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                View provider
              </Link>
            ) : null}
            {reported ? (
              <Link
                href={ROUTES.adminReportsForInterest(interest.id)}
                className="inline-flex h-8 items-center rounded-md border border-red-300 bg-red-100 px-3 text-xs font-semibold text-red-800 hover:bg-red-200"
              >
                Review reports
              </Link>
            ) : (
              <Link
                href={ROUTES.adminReportsForInterest(interest.id)}
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
