"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const trustNoteKeys = ["note1", "note2", "note3"] as const;

export function OnboardingTrustNotes() {
  const t = useTranslations("onboarding.trustNotes");

  return (
    <div
      className="mt-6 max-w-[900px] rounded-xl border border-[#DCEFE5] border-l-4 border-l-[#33B573] bg-[#F7FCF9] px-4 py-4 sm:mt-8 sm:px-8 sm:py-6"
      aria-labelledby="onboarding-trust-title"
    >
      <h2
        id="onboarding-trust-title"
        className="text-sm font-semibold tracking-tight text-zinc-800"
      >
        {t("title")}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {trustNoteKeys.map((key) => (
          <li
            key={key}
            className="flex gap-2 text-sm leading-snug text-zinc-700"
          >
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#33B573]"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
