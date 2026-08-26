"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ContactSupportForm } from "@/components/support/contact-support-form";
import type { SupportSource } from "@/validations/support";

type ContactSupportModalProps = {
  open: boolean;
  onClose: () => void;
  source?: SupportSource;
  defaultName?: string;
  defaultEmail?: string;
  defaultCompanyName?: string;
};

export function ContactSupportModal({
  open,
  onClose,
  source = "dashboard",
  defaultName,
  defaultEmail,
  defaultCompanyName,
}: ContactSupportModalProps) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        aria-label={t("dismiss")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-support-title"
        className="relative z-10 flex max-h-[min(92svh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-200/90 bg-white shadow-xl shadow-zinc-950/15 sm:rounded-xl"
      >
        <div className="shrink-0 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="contact-support-title"
                className="text-lg font-semibold tracking-tight text-zinc-900"
              >
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">{t("description")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 px-2"
              onClick={onClose}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          <ContactSupportForm
            source={source}
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            defaultCompanyName={defaultCompanyName}
            lockIdentity={Boolean(defaultEmail)}
            compact
          />
        </div>
      </div>
    </div>
  );
}
