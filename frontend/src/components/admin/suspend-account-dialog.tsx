"use client";

import { Button } from "@/components/ui/button";

type SuspendAccountDialogProps = {
  open: boolean;
  companyName: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SuspendAccountDialog({
  open,
  companyName,
  busy = false,
  onConfirm,
  onCancel,
}: SuspendAccountDialogProps) {
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
        aria-labelledby="suspend-account-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-950/15"
      >
        <div className="space-y-2">
          <h2
            id="suspend-account-title"
            className="text-lg font-semibold text-zinc-900"
          >
            Suspend {companyName}?
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">
            Suspending a participant will block platform access until
            reactivated.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={onConfirm}
          >
            Suspend account
          </Button>
        </div>
      </div>
    </div>
  );
}
