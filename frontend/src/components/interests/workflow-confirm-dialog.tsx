"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export type WorkflowConfirmKind = "complete" | "close";

type WorkflowConfirmDialogProps = {
  open: boolean;
  kind: WorkflowConfirmKind;
  onConfirm: () => void;
  onCancel: () => void;
};

export function WorkflowConfirmDialog({
  open,
  kind,
  onConfirm,
  onCancel,
}: WorkflowConfirmDialogProps) {
  const t = useTranslations("interests.workflow");

  if (!open) return null;

  const title = kind === "complete" ? t("completeTitle") : t("closeTitle");
  const body = kind === "complete" ? t("completeBody") : t("closeBody");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-confirm-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-950/15 sm:p-8"
      >
        <div className="space-y-2">
          <h2 id="workflow-confirm-title" className="text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={kind === "close" ? "outline" : "primary"}
            className={kind === "close" ? "border-zinc-300 text-zinc-800" : undefined}
            onClick={onConfirm}
          >
            {t("confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
