"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { InterestInlineMessages } from "@/components/interests/interest-inline-messages";
import { ReportActions } from "@/components/reports/report-actions";
import {
  WorkflowConfirmDialog,
  type WorkflowConfirmKind,
} from "@/components/interests/workflow-confirm-dialog";
import { InterestStatusBadge } from "@/components/interests/interest-status-badge";
import {
  canMessageInline,
  historyStatusLabel,
} from "@/components/interests/interests-inventory-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import type { InterestWorkflowAction } from "@/services/interests/interest.service";
import type { Interest, InterestStatus } from "@/types/interest";
import { formatMediumDate } from "@/utils/format-relative-time";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  primary: { next: InterestWorkflowAction; label: string };
  secondary: { next: InterestWorkflowAction; label: string };
  helper: string;
};

function workflowStepFor(
  status: InterestStatus,
  t: ReturnType<typeof useTranslations<"interests.card">>
): WorkflowStep | null {
  switch (status) {
    case "accepted":
      return {
        primary: { next: "discussion", label: t("startDiscussion") },
        secondary: { next: "closed", label: t("closeWithoutCompletion") },
        helper: t("helperAccepted"),
      };
    case "discussion":
      return {
        primary: { next: "completed", label: t("completeDeal") },
        secondary: { next: "closed", label: t("closeWithoutCompletion") },
        helper: t("helperDiscussion"),
      };
    case "pickup_scheduled":
      return {
        primary: { next: "completed", label: t("completeDeal") },
        secondary: { next: "closed", label: t("closeWithoutCompletion") },
        helper: t("helperPickup"),
      };
    default:
      return null;
  }
}

type InterestInboxCardProps = {
  interest: Interest;
  isProvider: boolean;
  variant?: "pending" | "active" | "history" | "default";
  expanded?: boolean;
  onToggleExpand?: () => void;
  onRespond: (id: string, status: "accepted" | "rejected") => void;
  onAdvanceWorkflow: (id: string, status: InterestWorkflowAction) => void;
  onRefresh?: () => void;
};

export function InterestInboxCard({
  interest: i,
  isProvider,
  variant = "default",
  expanded = false,
  onToggleExpand,
  onRespond,
  onAdvanceWorkflow,
  onRefresh,
}: InterestInboxCardProps) {
  const t = useTranslations("interests.card");
  const tReport = useTranslations("reports");
  const { formatRelativeTime } = useLocalizedTime();
  const [confirmKind, setConfirmKind] = useState<WorkflowConfirmKind | null>(null);

  const isPending = i.status === "pending";
  const isHistoryReadOnly = variant === "history";
  const historyLabel = historyStatusLabel(i.status);
  const workflowStep = workflowStepFor(i.status, t);
  const showInlineMessages = canMessageInline(i.status, i.conversationId);
  const showWorkflow =
    isProvider && !isPending && !isHistoryReadOnly && workflowStep !== null;

  const contextLine = (() => {
    switch (i.status) {
      case "discussion":
        return t("discussionStarted", { time: formatRelativeTime(i.updatedAt) });
      case "pickup_scheduled":
        return t("inProgress", { time: formatRelativeTime(i.updatedAt) });
      case "accepted":
        return t("accepted", { time: formatRelativeTime(i.updatedAt) });
      default:
        return null;
    }
  })();

  const counterpartyId = isProvider ? i.buyer?.id : i.providerId;
  const counterpartyLabel = isProvider
    ? i.buyer?.companyName ?? t("buyerFallback")
    : i.provider?.companyName ?? "Provider";
  const interestContextNote = `Reported from interest inbox (${i.materialTitle}).`;

  function requestWorkflowAction(action: InterestWorkflowAction): void {
    if (action === "completed") {
      setConfirmKind("complete");
      return;
    }
    if (action === "closed") {
      setConfirmKind("close");
      return;
    }
    onAdvanceWorkflow(i.id, action);
  }

  function confirmWorkflowAction(): void {
    if (!confirmKind) return;
    const action = confirmKind === "complete" ? "completed" : "closed";
    setConfirmKind(null);
    onAdvanceWorkflow(i.id, action);
  }

  return (
    <Card
      className={cn(
        "border-zinc-200/80",
        variant === "pending" &&
          isProvider &&
          "border-amber-300/90 bg-amber-50/30 shadow-sm shadow-amber-950/5",
        expanded && showInlineMessages && "ring-1 ring-zinc-200"
      )}
    >
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
        {variant === "pending" && isProvider ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {t("waitingDecision")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {isProvider ? (
              <>
                <CardTitle className="text-base font-semibold text-pretty text-zinc-900">
                  {i.buyer?.companyName ?? t("buyerFallback")}
                </CardTitle>
                <CardDescription className="text-sm text-zinc-600">
                  {t("materialLabel")}:{" "}
                  <span className="font-medium text-zinc-800">{i.materialTitle}</span>
                  {" · "}
                  {formatRelativeTime(i.createdAt)}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold text-pretty text-zinc-900">
                    {i.materialTitle}
                  </CardTitle>
                  <InterestStatusBadge status={i.status} />
                </div>
                <CardDescription className="space-y-0.5 text-sm text-zinc-600">
                  {i.provider?.companyName ? (
                    <span className="block">
                      <span className="font-medium text-zinc-700">
                        {t("providerLabel")}:{" "}
                      </span>
                      {i.provider.companyName}
                    </span>
                  ) : null}
                  {i.pickupTimeline ? (
                    <span className="block">
                      <span className="font-medium text-zinc-700">
                        {t("requestedLabel")}:{" "}
                      </span>
                      {i.pickupTimeline}
                    </span>
                  ) : (
                    <span className="block text-zinc-500">
                      {formatRelativeTime(i.createdAt)}
                    </span>
                  )}
                </CardDescription>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {isProvider ? <InterestStatusBadge status={i.status} /> : null}
              {showInlineMessages && onToggleExpand ? (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline sm:min-h-0 sm:text-xs"
                >
                  {expanded ? t("collapse") : t("expand")}
                </button>
              ) : null}
            </div>
            {contextLine && !isPending && !isHistoryReadOnly ? (
              <p className="text-xs text-zinc-500">{contextLine}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0 text-sm text-zinc-700 sm:p-6 sm:pt-0">
        {isProvider && i.pickupTimeline ? (
          <p>
            <span className="font-medium text-zinc-800">
              {t("requestedLabel")}:{" "}
            </span>
            {i.pickupTimeline}
          </p>
        ) : null}
        {i.message && (!expanded || !showInlineMessages) && isProvider ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            <span className="font-medium text-zinc-800">Original message: </span>
            {i.message}
          </p>
        ) : null}

        {isHistoryReadOnly && historyLabel ? (
          <p className="text-sm font-medium text-zinc-700">
            {historyLabel} on {formatMediumDate(i.updatedAt)}
          </p>
        ) : null}

        {isProvider && isPending ? (
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="h-12 w-full sm:h-9 sm:w-auto"
              onClick={() => onRespond(i.id, "accepted")}
            >
              {t("startDiscussion")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full sm:h-9 sm:w-auto"
              onClick={() => onRespond(i.id, "rejected")}
            >
              {t("reject")}
            </Button>
          </div>
        ) : null}

        <ReportActions
          className="border-t border-zinc-100 pt-3"
          buttonClassName="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-800 hover:underline sm:min-h-0 sm:text-xs sm:text-zinc-500"
          items={[
            ...(!isProvider
              ? [
                  {
                    label: tReport("actions.material"),
                    targetType: "material" as const,
                    targetMaterialId: i.materialId,
                    subjectLabel: i.materialTitle,
                    contextNote: interestContextNote,
                  },
                ]
              : []),
            ...(counterpartyId
              ? [
                  {
                    label: isProvider
                      ? tReport("actions.buyer")
                      : tReport("actions.provider"),
                    targetType: "participant" as const,
                    targetUserId: counterpartyId,
                    subjectLabel: counterpartyLabel,
                    contextNote: interestContextNote,
                  },
                ]
              : []),
          ]}
        />

        {expanded && showInlineMessages && i.conversationId ? (
          <>
            <InterestInlineMessages
              conversationId={i.conversationId}
              onMessageSent={onRefresh}
            />

            {showWorkflow && workflowStep ? (
              <div className="space-y-3 border-t border-zinc-200/80 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Next step
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{workflowStep.helper}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    className="h-12 w-full sm:h-9 sm:w-auto"
                    onClick={() => requestWorkflowAction(workflowStep.primary.next)}
                  >
                    {workflowStep.primary.label}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full text-zinc-700 sm:h-9 sm:w-auto"
                    onClick={() => requestWorkflowAction(workflowStep.secondary.next)}
                  >
                    {workflowStep.secondary.label}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {!expanded && showInlineMessages ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-800 underline-offset-4 hover:underline"
          >
            {t("openMessages")} →
          </button>
        ) : null}

        <div>
          <Link
            href={ROUTES.materialDetail(i.materialId)}
            className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:underline sm:min-h-0 sm:text-xs"
          >
            {t("viewMaterial")} →
          </Link>
        </div>
      </CardContent>

      <WorkflowConfirmDialog
        open={confirmKind !== null}
        kind={confirmKind ?? "complete"}
        onConfirm={confirmWorkflowAction}
        onCancel={() => setConfirmKind(null)}
      />
    </Card>
  );
}
