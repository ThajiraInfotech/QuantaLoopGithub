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
};

export function MaterialsSelection({
  selected,
  onChange,
  label,
  description,
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
      <div className="space-y-3">
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
            className="border-zinc-200 bg-white pl-9"
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
        <div className="flex flex-wrap gap-2">
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
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-[200ms] ease-[ease]",
                  isActive
                    ? "border-[#33B573] bg-[#F7FCF9] text-[#33B573]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-[#33B573] hover:bg-[#F7FCF9]"
                )}
              >
                {isActive ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                ) : null}
                {material}
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
