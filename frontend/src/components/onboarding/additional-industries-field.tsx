"use client";

import { Check, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ONBOARDING_INDUSTRY_OPTIONS } from "@/constants/industry-options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AdditionalIndustriesFieldProps = {
  primaryIndustry: string | null;
  selected: string[];
  onChange: (industries: string[]) => void;
};

export function AdditionalIndustriesField({
  primaryIndustry,
  selected,
  onChange,
}: AdditionalIndustriesFieldProps) {
  const [expanded, setExpanded] = useState(() => selected.length > 0);
  const [query, setQuery] = useState("");

  const available = useMemo(() => {
    const primaryKey = primaryIndustry?.trim().toLowerCase() ?? "";
    return ONBOARDING_INDUSTRY_OPTIONS.filter(
      (item) => item.toLowerCase() !== primaryKey,
    );
  }, [primaryIndustry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((item) => item.toLowerCase().includes(q));
  }, [available, query]);

  useEffect(() => {
    if (query.trim()) {
      setExpanded(true);
    }
  }, [query]);

  function toggle(industry: string) {
    const key = industry.toLowerCase();
    if (selected.some((s) => s.toLowerCase() === key)) {
      onChange(selected.filter((s) => s.toLowerCase() !== key));
    } else {
      onChange([...selected, industry].slice(0, 39));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Label
          htmlFor={expanded ? "additional-industry-search" : undefined}
          className="text-sm font-medium text-zinc-800"
        >
          Additional industries (optional)
        </Label>
        {selected.length > 0 && !expanded ? (
          <span className="shrink-0 text-xs font-medium text-[#33B573]">
            {selected.length} selected
          </span>
        ) : null}
      </div>

      {!expanded && selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((industry) => (
            <button
              key={industry}
              type="button"
              onClick={() => toggle(industry)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#33B573] bg-[#F7FCF9] px-3 py-1 text-xs font-medium text-[#33B573]"
            >
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              {industry}
            </button>
          ))}
        </div>
      ) : null}

      {expanded ? (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              id="additional-industry-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries…"
              className="border-zinc-200 bg-white pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filtered.map((industry) => {
              const isActive = selected.some(
                (s) => s.toLowerCase() === industry.toLowerCase(),
              );
              return (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggle(industry)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-[200ms] ease-[ease]",
                    isActive
                      ? "border-[#33B573] bg-[#F7FCF9] text-[#33B573]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-[#33B573] hover:bg-[#F7FCF9]",
                  )}
                >
                  {isActive ? (
                    <Check
                      className="h-3.5 w-3.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : null}
                  {industry}
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">No matching industries.</p>
          ) : null}
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#33B573] transition-opacity hover:opacity-80"
        aria-expanded={expanded}
      >
        <Plus
          className={cn("h-4 w-4 transition-transform", expanded && "rotate-45")}
          aria-hidden
        />
        {expanded ? "Hide additional industries" : "Add additional industries"}
      </button>
    </div>
  );
}
