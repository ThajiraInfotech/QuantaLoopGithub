"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { SuspendAccountDialog } from "@/components/admin/suspend-account-dialog";
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
import {
  fetchAdminParticipantDetail,
  patchParticipantAccountStatus,
} from "@/services/admin/admin.service";
import type { AdminParticipantDetail } from "@/types/admin";
import type { AccountStatus } from "@/types/admin";
import {
  formatMediumDate,
  formatRelativeTime,
  formatRelativeWhen,
} from "@/utils/format-relative-time";

type AdminParticipantDetailViewProps = {
  participantId: string;
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

function ProfileField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-zinc-900">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function ActivityStatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string | null;
}) {
  const content = (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 transition-colors">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900">
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg hover:border-zinc-200 [&>div]:hover:border-zinc-200 [&>div]:hover:bg-zinc-50"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function recentActivityHref(
  participantId: string,
  item: AdminParticipantDetail["recentActivity"][number]
): string | null {
  if (!item.relatedId) return null;

  switch (item.relatedType) {
    case "material":
      return ROUTES.materialDetail(item.relatedId);
    case "interest":
      return ROUTES.adminInterestDetail(item.relatedId);
    case "conversation":
      return ROUTES.conversationDetail(item.relatedId);
    case "user":
      return ROUTES.adminParticipantDetail(participantId);
    default:
      return null;
  }
}

export function AdminParticipantDetailView({
  participantId,
}: AdminParticipantDetailViewProps) {
  const [data, setData] = useState<AdminParticipantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminParticipantDetail(participantId);
      setData(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load participant");
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSuspend(suspended: boolean) {
    setBusy(true);
    try {
      await patchParticipantAccountStatus(
        participantId,
        suspended ? "suspended" : "active"
      );
      toast.success(suspended ? "Account suspended" : "Account reactivated");
      setSuspendOpen(false);
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
        <div className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        <div className="h-48 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <p className="text-sm text-red-700">{error ?? "Participant not found."}</p>
        <Link
          href={ROUTES.adminParticipants}
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          ← Participants
        </Link>
      </div>
    );
  }

  const { profile, accountHealth, activity, recentActivity } = data;
  const isSuspended = profile.accountStatus === "suspended";
  const website = profile.website?.trim();
  const websiteHref =
    website && !website.startsWith("http") ? `https://${website}` : website;

  const materialsHref = ROUTES.adminMaterialsForParticipant(participantId);
  const interestsCreatedHref = ROUTES.adminInterestsForParticipant(
    participantId,
    "created"
  );
  const interestsReceivedHref = ROUTES.adminInterestsForParticipant(
    participantId,
    "received"
  );
  const completedDealsHref = ROUTES.adminInterestsForParticipant(
    participantId,
    "completed"
  );
  const activeDiscussionsHref = ROUTES.adminDiscussionsForParticipant(
    participantId,
    "active"
  );
  const discussionsHref = ROUTES.adminDiscussionsForParticipant(participantId);

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="space-y-3">
        <Link
          href={ROUTES.adminParticipants}
          className="inline-flex h-8 items-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to participants
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {profile.companyName}
              </h1>
              <RoleBadge role={profile.role} />
              <AccountStatusBadge
                status={profile.accountStatus ?? "active"}
              />
            </div>
            <p className="text-sm text-zinc-700">{profile.name}</p>
            {profile.jobTitle ? (
              <p className="text-sm text-zinc-500">{profile.jobTitle}</p>
            ) : null}
            <p className="text-xs text-zinc-500">
              Joined {formatMediumDate(profile.createdAt)} ·{" "}
              {formatRelativeWhen(profile.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-zinc-200/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profile overview</CardTitle>
            <CardDescription>Contact and account details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
              <ProfileField label="Email" value={profile.email} />
              <ProfileField
                label="Phone"
                value={profile.phone?.trim() ? profile.phone : "Not provided"}
              />
              <ProfileField
                label="Location"
                value={profile.location?.trim() ? profile.location : "—"}
              />
              <ProfileField
                label="Industry"
                value={profile.industryType?.trim() ? profile.industryType : "—"}
              />
              {website ? (
                <ProfileField label="Website" value={website} href={websiteHref} />
              ) : (
                <ProfileField label="Website" value="—" />
              )}
              <ProfileField
                label="Last activity"
                value={formatRelativeWhen(accountHealth.lastActivityAt)}
              />
              <ProfileField
                label="Total logins"
                value={String(accountHealth.loginCount)}
              />
              <ProfileField
                label="Profile completion"
                value={`${profile.profileCompletion}%`}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity summary</CardTitle>
            <CardDescription>Platform engagement at a glance</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <ActivityStatCard
              label="Materials published"
              value={activity.materialsPublished}
              href={materialsHref}
            />
            <ActivityStatCard
              label="Interests created"
              value={activity.interestsCreated}
              href={interestsCreatedHref}
            />
            <ActivityStatCard
              label="Interests received"
              value={activity.interestsReceived}
              href={interestsReceivedHref}
            />
            <ActivityStatCard
              label="Active discussions"
              value={activity.activeDiscussions}
              href={activeDiscussionsHref}
            />
            <ActivityStatCard
              label="Completed deals"
              value={activity.completedDeals}
              href={completedDealsHref}
            />
            <ActivityStatCard
              label="Total discussions"
              value={activity.totalDiscussions}
              href={discussionsHref}
            />
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Last login
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {accountHealth.lastLoginAt
                  ? formatRelativeWhen(accountHealth.lastLoginAt)
                  : "No login recorded"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Latest platform actions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent activity recorded.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentActivity.map((item, index) => {
                    const href = recentActivityHref(participantId, item);
                    return (
                      <tr
                        key={`${item.type}-${item.occurredAt}-${index}`}
                        className="bg-white"
                      >
                        <td className="px-3 py-2.5 text-zinc-800">
                          {href ? (
                            <Link
                              href={href}
                              className="hover:text-zinc-950 hover:underline"
                            >
                              {item.description}
                            </Link>
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-zinc-500">
                          {formatMediumDate(item.occurredAt)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-zinc-500">
                          {formatRelativeWhen(item.occurredAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account actions</CardTitle>
            <CardDescription>Manage platform access</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <AccountStatusBadge status={profile.accountStatus ?? "active"} />
            {isSuspended ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void handleSuspend(false)}
              >
                Reactivate account
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setSuspendOpen(true)}
              >
                Suspend account
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick access</CardTitle>
            <CardDescription>Jump to related records</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link
              href={materialsHref}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View materials
            </Link>
            <Link
              href={interestsCreatedHref}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View interests
            </Link>
            <Link
              href={discussionsHref}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View discussions
            </Link>
            <Link
              href={ROUTES.adminReportsForParticipant(participantId)}
              className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View reports
            </Link>
          </CardContent>
        </Card>
      </div>

      <SuspendAccountDialog
        open={suspendOpen}
        companyName={profile.companyName}
        busy={busy}
        onConfirm={() => void handleSuspend(true)}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  );
}
