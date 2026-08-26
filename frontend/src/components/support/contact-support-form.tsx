"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactSupportRequest } from "@/services/support/support.service";
import { cn } from "@/lib/utils";
import {
  createContactSupportSchema,
  SUPPORT_CATEGORIES,
  type ContactSupportFormValues,
  type SupportSource,
} from "@/validations/support";

type ContactSupportFormProps = {
  source: SupportSource;
  defaultName?: string;
  defaultEmail?: string;
  defaultCompanyName?: string;
  lockIdentity?: boolean;
  onSuccess?: () => void;
  className?: string;
  compact?: boolean;
};

export function ContactSupportForm({
  source,
  defaultName = "",
  defaultEmail = "",
  defaultCompanyName = "",
  lockIdentity = false,
  onSuccess,
  className,
  compact = false,
}: ContactSupportFormProps) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const schema = useMemo(
    () =>
      createContactSupportSchema({
        nameRequired: t("validation.nameRequired"),
        nameTooLong: t("validation.nameTooLong"),
        emailInvalid: t("validation.emailInvalid"),
        descriptionMin: t("validation.descriptionMin"),
        descriptionMax: t("validation.descriptionMax"),
      }),
    [t]
  );

  const form = useForm<ContactSupportFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      category: "other",
      description: "",
      companyName: defaultCompanyName,
      website: "",
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultName,
      email: defaultEmail,
      category: "other",
      description: "",
      companyName: defaultCompanyName,
      website: "",
    });
    setSent(false);
    setFormError(null);
  }, [defaultName, defaultEmail, defaultCompanyName, form]);

  const { errors, isSubmitting, isSubmitted, touchedFields } = form.formState;

  function fieldError(
    name: keyof ContactSupportFormValues,
    touched: boolean | undefined
  ) {
    return Boolean(errors[name]?.message) && (touched || isSubmitted);
  }

  async function onSubmit(values: ContactSupportFormValues) {
    setFormError(null);
    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : undefined;
      await submitContactSupportRequest({
        ...values,
        companyName: values.companyName || defaultCompanyName || undefined,
        source,
        pageUrl,
      });
      setSent(true);
      toast.success(t("successToast"));
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errorGeneric");
      setFormError(msg);
      toast.error(msg);
    }
  }

  if (sent) {
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-5 py-6 text-center",
          className
        )}
        role="status"
      >
        <p className="text-base font-semibold text-emerald-900">
          {t("successTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800/90">
          {t("successDescription")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => {
            setSent(false);
            form.reset({
              name: defaultName,
              email: defaultEmail,
              category: "other",
              description: "",
              companyName: defaultCompanyName,
              website: "",
            });
          }}
        >
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("relative space-y-4", className)}
      noValidate
    >
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor="support-name">{t("fields.name")}</Label>
          <Input
            id="support-name"
            autoComplete="name"
            disabled={isSubmitting || lockIdentity}
            {...form.register("name")}
          />
          {fieldError("name", touchedFields.name) ? (
            <p className="text-sm text-red-600" role="alert">
              {errors.name?.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-email">{tCommon("email")}</Label>
          <Input
            id="support-email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting || lockIdentity}
            {...form.register("email")}
          />
          {fieldError("email", touchedFields.email) ? (
            <p className="text-sm text-red-600" role="alert">
              {errors.email?.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-category">{t("fields.category")}</Label>
        <select
          id="support-category"
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-small text-foreground shadow-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("category")}
        >
          {SUPPORT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`categories.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-description">{t("fields.description")}</Label>
        <Textarea
          id="support-description"
          rows={compact ? 4 : 6}
          maxLength={4000}
          disabled={isSubmitting}
          placeholder={t("fields.descriptionPlaceholder")}
          className="resize-y"
          {...form.register("description")}
        />
        {fieldError("description", touchedFields.description) ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.description?.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <Label htmlFor="support-website">Website</Label>
        <Input
          id="support-website"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? t("sending") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
