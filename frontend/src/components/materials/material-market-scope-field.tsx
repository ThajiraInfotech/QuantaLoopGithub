"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MaterialMarketScope } from "@/types/material";

type MaterialMarketScopeFieldProps = {
  value: MaterialMarketScope;
  onChange: (scope: MaterialMarketScope) => void;
  className?: string;
};

const OPTIONS: { value: MaterialMarketScope; title: string; hint: string }[] = [
  {
    value: "india",
    title: "India alone",
    hint: "Visible to buyers in India with city and state proximity.",
  },
  {
    value: "global",
    title: "Sell globally",
    hint: "Also visible to buyers outside India. Your India location stays the same.",
  },
];

export function MaterialMarketScopeField({
  value,
  onChange,
  className,
}: MaterialMarketScopeFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label>Market reach</Label>
        <p className="mt-1 text-xs text-zinc-500">
          Choose whether this listing stays India-only or is also shown abroad.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                selected
                  ? "border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              )}
            >
              <p className="text-sm font-medium text-zinc-900">{option.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {option.hint}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
