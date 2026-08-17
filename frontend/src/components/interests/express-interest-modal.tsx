"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInterestRequest } from "@/services/interests/interest.service";
import { fetchUnreadNotificationCount } from "@/services/notifications/notification.service";
import { useNotificationStore } from "@/store/notification-store";
import {
  expressInterestSchema,
  type ExpressInterestFormValues,
} from "@/validations/interest-express";

type ExpressInterestModalProps = {
  open: boolean;
  materialId: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ExpressInterestModal({
  open,
  materialId,
  onClose,
  onSubmitted,
}: ExpressInterestModalProps) {
  const t = useTranslations("interests.express");
  const tCommon = useTranslations("common");
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(expressInterestSchema),
    defaultValues: { message: "", pickupTimeline: "" },
  });

  if (!open) return null;

  async function onSubmit(values: ExpressInterestFormValues): Promise<void> {
    setFormError(null);
    try {
      await createInterestRequest({
        materialId,
        message: values.message,
        pickupTimeline: values.pickupTimeline,
      });
      toast.success(t("success"));
      try {
        const n = await fetchUnreadNotificationCount();
        setUnreadCount(n);
      } catch {
        /* ignore */
      }
      form.reset();
      onSubmitted();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to send interest";
      setFormError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-950/15 sm:p-8"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900">{t("title")}</h2>
          <p className="text-sm leading-relaxed text-zinc-600">{t("description")}</p>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="pickupTimeline">{t("pickupLabel")}</Label>
            <Input
              id="pickupTimeline"
              placeholder={t("pickupPlaceholder")}
              {...form.register("pickupTimeline")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t("messageLabel")}</Label>
            <Textarea
              id="message"
              placeholder={t("messagePlaceholder")}
              {...form.register("message")}
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="space-y-3 pt-2">
            <p className="text-xs text-zinc-500">{t("notifyHint")}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t("sending") : t("submit")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
