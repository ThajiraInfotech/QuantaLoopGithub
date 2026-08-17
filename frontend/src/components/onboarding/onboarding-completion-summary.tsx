"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { buildLocationSummary } from "@/lib/onboarding-readiness";
import {
  normalizeLocationDraft,
  useOnboardingStore,
} from "@/store/onboarding-store";
import { cn } from "@/lib/utils";

export function OnboardingCompletionSummary() {
  const t = useTranslations("onboarding.completionSummary");
  const tRoles = useTranslations("common.roles");
  const role = useOnboardingStore((s) => s.pendingSignupRole);
  const materials = useOnboardingStore((s) => s.draftMaterials);
  const location = normalizeLocationDraft(useOnboardingStore((s) => s.draftLocation));

  const locationLabel = buildLocationSummary(location);
  const isBuyer = role === "verified_buyer";
  const materialsLabel = isBuyer
    ? t("materialsBuyer")
    : t("materialsProvider");

  const roleLabel = role
    ? t("roleWithLabel", { role: tRoles(role) })
    : t("roleSelected");

  const materialsItemLabel =
    materials.length > 0
      ? t("materialsWithList", {
          label: materialsLabel,
          list: `${materials.slice(0, 2).join(", ")}${
            materials.length > 2 ? ` +${materials.length - 2}` : ""
          }`,
        })
      : t("materialsRequired", { label: materialsLabel });

  const locationItemLabel = locationLabel
    ? t("locationWithLabel", { location: locationLabel })
    : t("locationRequired");

  const items = [
    { label: roleLabel, done: Boolean(role) },
    { label: materialsItemLabel, done: materials.length > 0 },
    {
      label: locationItemLabel,
      done: Boolean(location.stateCode && location.city.trim()),
    },
  ] as const;

  return (
    <div className="rounded-lg border border-[#DCEFE5] bg-[#F7FCF9] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
        {t("title")}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{t("description")}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={cn(
              "flex items-start gap-2 text-sm",
              item.done ? "text-zinc-800" : "text-zinc-500"
            )}
          >
            {item.done ? (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#33B573]"
                strokeWidth={2.25}
                aria-hidden
              />
            ) : (
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-zinc-300"
                aria-hidden
              />
            )}
            <span className="leading-snug">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
