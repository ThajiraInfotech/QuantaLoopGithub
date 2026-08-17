"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const legalLinkClass =
  "font-medium text-[#33B573] underline-offset-4 hover:text-[#2e9f66] hover:underline";

type LegalConsentCheckboxProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function LegalConsentCheckbox({
  id = "legal-consent",
  checked,
  onCheckedChange,
  className,
}: LegalConsentCheckboxProps) {
  const t = useTranslations("legal.consent");

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-zinc-300 text-[#33B573] accent-[#33B573] focus:ring-2 focus:ring-[#33B573]/30 focus:ring-offset-0"
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm leading-relaxed text-zinc-600"
      >
        {t("prefix")}{" "}
        <Link href={ROUTES.legalTerms} className={legalLinkClass}>
          {t("terms")}
        </Link>{" "}
        {t("and")}{" "}
        <Link href={ROUTES.legalPrivacy} className={legalLinkClass}>
          {t("privacy")}
        </Link>
        {t("suffix")}
      </label>
    </div>
  );
}
