"use client";

import { Button } from "@/components/ui/button";

type AdminBulkConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminBulkConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: AdminBulkConfirmDialogProps) {
  if (!open) return null;

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
        aria-labelledby="admin-bulk-confirm-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl"
      >
        <div className="space-y-2">
          <h2
            id="admin-bulk-confirm-title"
            className="text-lg font-semibold text-zinc-900"
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
