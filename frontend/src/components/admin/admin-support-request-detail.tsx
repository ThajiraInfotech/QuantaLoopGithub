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
import {
  fetchAdminSupportRequestDetail,
  resolveAdminSupportRequest,
} from "@/services/admin/admin.service";
import type { AdminSupportRequestDetail } from "@/types/admin";
import {
  formatMediumDate,
  formatRelativeWhen,
} from "@/utils/format-relative-time";

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

type AdminSupportRequestDetailViewProps = {
  requestId: string;
};

export function AdminSupportRequestDetailView({
  requestId,
}: AdminSupportRequestDetailViewProps) {
  const [data, setData] = useState<AdminSupportRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminSupportRequestDetail(requestId);
      setData(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load support request");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResolve() {
    setResolving(true);
    try {
      await resolveAdminSupportRequest(requestId);
      toast.success("Support request marked resolved");
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
        <p className="text-sm text-red-700">{error ?? "Support request not found."}</p>
        <Link
          href={ROUTES.adminSupport}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          ← Support requests
        </Link>
      </div>
    );
  }

  const { request, linkedUser, resolution, history } = data;
  const isOpen = request.status !== "resolved";
  const refId =
    request.supportRefId ?? `SUP-${request.id.slice(-8).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-6">
      <div className="space-y-3">
        <Link
          href={ROUTES.adminSupport}
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to support requests
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-zinc-900">
              {refId}
            </h1>
            <Badge variant={isOpen ? "destructive" : "secondary"}>
              {isOpen ? "Open" : "Resolved"}
            </Badge>
            <Badge variant="outline">
              {CATEGORY_LABELS[request.category] ?? request.category}
            </Badge>
          </div>
          {isOpen ? (
            <Button
              type="button"
              variant="outline"
              disabled={resolving}
              onClick={() => void handleResolve()}
            >
              Mark resolved
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
          <CardDescription>
            Submitted {formatMediumDate(request.createdAt)} (
            {formatRelativeWhen(request.createdAt)})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">{request.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Email</dt>
              <dd className="break-all text-zinc-900">
                <a
                  href={`mailto:${request.email}`}
                  className="text-zinc-900 underline-offset-2 hover:underline"
                >
                  {request.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Company</dt>
              <dd className="text-zinc-900">{request.companyName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Source</dt>
              <dd className="text-zinc-900">
                {SOURCE_LABELS[request.source] ?? request.source}
              </dd>
            </div>
            {request.pageUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Page URL</dt>
                <dd className="break-all text-zinc-900">
                  <a
                    href={request.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {request.pageUrl}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          <div>
            <p className="text-xs font-medium text-zinc-500">Message</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {request.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {linkedUser ? (
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">Linked account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Name</dt>
                <dd className="text-zinc-900">{linkedUser.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Company</dt>
                <dd className="text-zinc-900">{linkedUser.companyName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Email</dt>
                <dd className="break-all text-zinc-900">{linkedUser.email}</dd>
              </div>
            </dl>
            <Link
              href={ROUTES.adminParticipantDetail(linkedUser.id)}
              className="mt-4 inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              View participant
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {history.map((entry) => (
              <li key={`${entry.type}-${entry.occurredAt}`} className="text-sm">
                <p className="font-medium text-zinc-900">{entry.label}</p>
                <p className="text-xs text-zinc-500">
                  {formatMediumDate(entry.occurredAt)} ·{" "}
                  {formatRelativeWhen(entry.occurredAt)}
                </p>
              </li>
            ))}
          </ul>
          {!isOpen && resolution.resolvedByName ? (
            <p className="mt-4 text-sm text-zinc-600">
              Resolved by {resolution.resolvedByName}
              {resolution.resolvedAt
                ? ` · ${formatMediumDate(resolution.resolvedAt)}`
                : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
