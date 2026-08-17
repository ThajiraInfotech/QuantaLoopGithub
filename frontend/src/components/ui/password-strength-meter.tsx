"use client";

import { useTranslations } from "next-intl";

import {
  getPasswordStrength,
  passwordStrengthClass,
  type PasswordStrength,
} from "@/lib/password-strength";
import { cn } from "@/lib/utils";

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const t = useTranslations("auth.passwordStrength");
  const strength = getPasswordStrength(password);
  if (!strength) return null;

  const width =
    strength === "weak" ? "33%" : strength === "medium" ? "66%" : "100%";

  const label = t(strength as PasswordStrength);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            passwordStrengthClass(strength)
          )}
          style={{ width }}
        />
      </div>
      <p className="text-xs text-zinc-500">
        {t("label")}{" "}
        <span className="font-medium text-zinc-700">{label}</span>
      </p>
    </div>
  );
}
