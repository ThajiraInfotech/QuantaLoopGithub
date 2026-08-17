"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { InterestStatusBadge } from "@/components/interests/interest-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { ROUTES } from "@/constants/routes";
import { fetchAdminInterestDetail } from "@/services/admin/admin.service";
import type { AdminInterestDetail } from "@/types/admin";
import type { AccountStatus } from "@/types/admin";
import type { InterestStatus } from "@/types/interest";
import type { MaterialStatus } from "@/types/material";
import {
  formatMediumDate,
  formatRelativeWhen,
} from "@/utils/format-relative-time";

const REPORT_REASON_LABELS: Record<string, string> = {
  misleading_information: "Misleading information",
  spam: "Spam",
  inactive_participant: "Inactive participant",
};

type AdminInterestDetailViewProps = {
  interestId: string;
};

function AccountStatusBadge({ status }: { status: AccountStatus }) {
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

function toMaterialStatus(status: string): MaterialStatus {
  if (status === "fulfilled") return "fulfilled";
  if (status === "in_discussion") return "in_discussion";
  if (status === "archived") return "archived";
  return "available";
}

export function AdminInterestDetailView({
  interestId,
}: AdminInterestDetailViewProps) {
  const [data, setData] = useState<AdminInterestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminInterestDetail(interestId);
      setData(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load interest");
    } finally {
      setLoading(false);
    }
  }, [interestId]);

  useEffect(() => {
    void load();
  }, [load]);

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
        <p className="text-sm text-red-700">{error ?? "Interest not found."}</p>
        <Link
          href={ROUTES.adminInterests}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          ← Interests
        </Link>
      </div>
    );
  }

  const { interest, buyer, provider, material, activity, conversation, messages, reports } =
    data;
  const hasReports = reports.open.length > 0;
  const status = interest.status as InterestStatus;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="space-y-3">
        <Link
          href={ROUTES.adminInterests}
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to interests
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-zinc-900">
              {interest.interestRefId}
            </h1>
            <InterestStatusBadge status={status} />
            {hasReports ? (
              <div className="inline-flex flex-col rounded-md border-2 border-red-400 bg-red-50 px-2.5 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">
                  ⚠ Reported
                </span>
                <span className="text-xs font-semibold text-red-800">
                  {reports.open.length} Open Report
                  {reports.open.length === 1 ? "" : "s"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.adminMaterialDetail(material.id)}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View material
            </Link>
            <Link
              href={ROUTES.adminParticipantDetail(buyer.id)}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View buyer
            </Link>
            <Link
              href={ROUTES.adminParticipantDetail(provider.id)}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View provider
            </Link>
            <Link
              href={ROUTES.adminReportsForInterest(interestId)}
              className={
                hasReports
                  ? "inline-flex h-9 items-center rounded-md border border-red-300 bg-red-100 px-3 text-sm font-semibold text-red-800 hover:bg-red-200"
                  : "inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              }
            >
              View reports
            </Link>
          </div>
        </div>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Interest overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Interest ID</dt>
              <dd className="font-mono text-zinc-900">{interest.interestRefId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Created</dt>
              <dd className="text-zinc-900">
                {formatMediumDate(interest.createdAt)} ·{" "}
                {formatRelativeWhen(interest.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Current status</dt>
              <dd>
                <InterestStatusBadge status={status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last activity</dt>
              <dd className="text-zinc-900">
                {formatRelativeWhen(interest.lastActivityAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Buyer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-900">{buyer.companyName}</p>
            <AccountStatusBadge status={buyer.accountStatus} />
            <p className="text-xs text-zinc-500">
              Joined {formatMediumDate(buyer.createdAt)} ·{" "}
              {formatRelativeWhen(buyer.createdAt)}
            </p>
            <p className="text-xs text-zinc-500">
              Last activity {formatRelativeWhen(buyer.lastActivityAt)}
            </p>
            <Link
              href={ROUTES.adminParticipantDetail(buyer.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View buyer
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-900">{provider.companyName}</p>
            <AccountStatusBadge status={provider.accountStatus} />
            <p className="text-xs text-zinc-500">
              Joined {formatMediumDate(provider.createdAt)} ·{" "}
              {formatRelativeWhen(provider.createdAt)}
            </p>
            <p className="text-xs text-zinc-500">
              Last activity {formatRelativeWhen(provider.lastActivityAt)}
            </p>
            <Link
              href={ROUTES.adminParticipantDetail(provider.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View provider
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-900">{material.title}</p>
            <p className="text-xs text-zinc-500">
              {material.lotId} · {material.materialType}
            </p>
            <p className="text-zinc-700">
              {material.quantity} {material.unit}
            </p>
            <MaterialStatusBadge status={toMaterialStatus(material.status)} />
            <Link
              href={ROUTES.adminMaterialDetail(material.id)}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View material
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Messages</p>
            <p className="text-xl font-semibold tabular-nums">{activity.messageCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">Discussion</p>
            <p className="text-sm font-medium capitalize text-zinc-900">
              {activity.discussionStatus}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
            <p className="text-xs font-medium text-zinc-500">First contact</p>
            <p className="text-sm font-medium text-zinc-900">
              {activity.firstContactAt
                ? formatRelativeWhen(activity.firstContactAt)
                : "—"}
            </p>
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
          <CardTitle className="text-base">Conversation preview</CardTitle>
          <CardDescription>
            Read-only view of communication history. Admins cannot send messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation ? (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-sm">
              <p className="text-xs font-medium text-zinc-500">Participants</p>
              <p className="text-zinc-900">
                {buyer.companyName} (Buyer) · {provider.companyName} (Provider)
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Status: {conversation.status}
                {conversation.lastMessageAt
                  ? ` · Last message ${formatRelativeWhen(conversation.lastMessageAt)}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No discussion started yet.</p>
          )}

          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages recorded.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-zinc-100 p-3">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className={
                    msg.isSystem
                      ? "rounded-md bg-zinc-100 px-3 py-2 text-xs italic text-zinc-600"
                      : "rounded-md border border-zinc-100 bg-white px-3 py-2 text-sm"
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-zinc-900">
                      {msg.senderCompany || msg.senderName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatMediumDate(msg.createdAt)} ·{" "}
                      {formatRelativeWhen(msg.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-700">{msg.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reports</CardTitle>
          <CardDescription>Related reports on material, buyer, or provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Open reports
            </p>
            {reports.open.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No open reports.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reports.open.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-zinc-900">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    <p className="text-xs capitalize text-zinc-500">{r.targetType}</p>
                    {r.details ? (
                      <p className="mt-1 text-zinc-600">{r.details}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Resolved reports
            </p>
            {reports.resolved.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No resolved reports.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reports.resolved.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-zinc-900">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    <p className="text-xs capitalize text-zinc-500">{r.targetType}</p>
                    {r.details ? (
                      <p className="mt-1 text-zinc-600">{r.details}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Report history
            </p>
            {reports.history.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No reports on record.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reports.history.map((r) => (
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
                    <p className="text-xs text-zinc-500">
                      {formatMediumDate(r.createdAt)} · {formatRelativeWhen(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href={ROUTES.adminReportsForInterest(interestId)}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View all reports
          </Link>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href={ROUTES.adminMaterialDetail(material.id)}>
            <Button type="button" size="sm" variant="outline">
              View material
            </Button>
          </Link>
          <Link href={ROUTES.adminParticipantDetail(buyer.id)}>
            <Button type="button" size="sm" variant="outline">
              View buyer
            </Button>
          </Link>
          <Link href={ROUTES.adminParticipantDetail(provider.id)}>
            <Button type="button" size="sm" variant="outline">
              View provider
            </Button>
          </Link>
          {conversation ? (
            <Link href={ROUTES.adminDiscussionsForMaterial(material.id)}>
              <Button type="button" size="sm" variant="outline">
                View discussion
              </Button>
            </Link>
          ) : null}
          <Link href={ROUTES.adminReportsForInterest(interestId)}>
            <Button type="button" size="sm" variant="outline">
              View reports
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
