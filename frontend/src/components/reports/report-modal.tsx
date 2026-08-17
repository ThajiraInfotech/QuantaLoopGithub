"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReportRequest } from "@/services/reports/report.service";
import type { ReportReason, ReportTargetType } from "@/types/report";

export type ReportModalTarget = {
  targetType: ReportTargetType;
  targetUserId?: string;
  targetMaterialId?: string;
  subjectLabel: string;
  contextNote?: string;
};

type ReportModalProps = {
  open: boolean;
  target: ReportModalTarget | null;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function ReportModal({
  open,
  target,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const t = useTranslations("reports.modal");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState<ReportReason>("misleading_information");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open || !target) return null;

  const activeTarget = target;

  const reasonOptions: { value: ReportReason; label: string }[] = [
    { value: "misleading_information", label: t("misleading") },
    { value: "spam", label: t("spam") },
    { value: "inactive_participant", label: t("inactive") },
  ];

  async function handleSubmit() {
    setFormError(null);
    setSubmitting(true);
    try {
      const contextPrefix = activeTarget.contextNote?.trim()
        ? `${activeTarget.contextNote.trim()}\n\n`
        : "";
      const body = `${contextPrefix}${details.trim()}`.trim();

      await createReportRequest({
        targetType: activeTarget.targetType,
        targetUserId: activeTarget.targetUserId,
        targetMaterialId: activeTarget.targetMaterialId,
        reason,
        details: body,
      });

      toast.success(t("success"));
      setReason("misleading_information");
      setDetails("");
      onSubmitted?.();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("error");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setFormError(null);
    onClose();
  }

  const title =
    target.targetType === "material" ? t("titleMaterial") : t("titleParticipant");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        aria-label={t("dismiss")}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-950/15 sm:p-8"
      >
        <h2
          id="report-modal-title"
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {t("description", { subject: target.subjectLabel })}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="report-reason">{t("reason")}</Label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="report-details">{t("details")}</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t("detailsPlaceholder")}
              className="mt-1.5 resize-none border-zinc-200 text-sm"
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={handleClose}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
