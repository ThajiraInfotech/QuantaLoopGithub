"use client";

import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MATERIAL_CATEGORY_GROUPS } from "@/constants/material-categories";
import { cn } from "@/lib/utils";

type MaterialsSelectionProps = {
  selected: string[];
  onChange: (materials: string[]) => void;
  label: string;
  description: string;
  /** Inside a card or form — skip the onboarding sticky search bar. */
  embedded?: boolean;
};

export function MaterialsSelection({
  selected,
  onChange,
  label,
  description,
  embedded = false,
}: MaterialsSelectionProps) {
  const t = useTranslations("onboarding.materials");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...MATERIAL_CATEGORY_GROUPS];
    return MATERIAL_CATEGORY_GROUPS.filter((item) =>
      item.toLowerCase().includes(q)
    );
  }, [query]);

  function toggleMaterial(material: string) {
    const normalized = material.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (selected.some((s) => s.toLowerCase() === key)) {
      onChange(selected.filter((s) => s.toLowerCase() !== key));
    } else {
      onChange([...selected, normalized]);
    }
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "space-y-3",
          !embedded &&
            "sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 border-b border-zinc-200/80 bg-zinc-50 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
        )}
      >
        <Label htmlFor="material-search">{label}</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <Input
            id="material-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 border-zinc-200 bg-white pl-9 text-base sm:h-10 sm:text-small"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
        </div>
        <p className="text-sm text-zinc-500">{description}</p>
        {selected.length > 0 ? (
          <p className="text-sm font-medium text-zinc-700">
            {t("categoriesSelected", { count: selected.length })}
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("categoriesHeading")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {filtered.map((material) => {
            const isActive = selected.some(
              (s) => s.toLowerCase() === material.toLowerCase()
            );
            return (
              <button
                key={material}
                type="button"
                onClick={() => toggleMaterial(material)}
                className={cn(
                  "inline-flex min-h-11 w-full cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-[200ms] ease-[ease] sm:min-h-0 sm:w-auto sm:rounded-full sm:py-1.5 sm:text-center",
                  isActive
                    ? "border-[#33B573] bg-[#F7FCF9] text-[#33B573]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-[#33B573] hover:bg-[#F7FCF9]"
                )}
              >
                {isActive ? (
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                ) : null}
                <span className="min-w-0 text-pretty">{material}</span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noMatchingCategories")}</p>
        ) : null}
      </div>
    </div>
  );
}
