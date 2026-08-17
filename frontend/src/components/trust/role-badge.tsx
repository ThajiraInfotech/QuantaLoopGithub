"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user";

type RoleBadgeProps = {
  role: UserRole;
  className?: string;
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const t = useTranslations("dashboard.participants.roleBadge");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700",
        className
      )}
    >
      {t(role)}
    </span>
  );
}
