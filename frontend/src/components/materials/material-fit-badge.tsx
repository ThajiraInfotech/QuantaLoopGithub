import { cn } from "@/lib/utils";

export type FitMatchTier = "excellent" | "strong" | "relevant";

export type FitMatchCategory = {
  tier: FitMatchTier;
  label: string;
  className: string;
};

export function getFitMatchCategory(score: number): FitMatchCategory {
  if (score >= 90) {
    return {
      tier: "excellent",
      label: "Excellent match",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }
  if (score >= 70) {
    return {
      tier: "strong",
      label: "Strong match",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    tier: "relevant",
    label: "Relevant",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
}

export function MaterialFitBadge({
  score,
  className,
  showScore = false,
}: {
  score: number;
  className?: string;
  showScore?: boolean;
}) {
  const category = getFitMatchCategory(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        category.className,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          category.tier === "excellent" && "bg-emerald-500",
          category.tier === "strong" && "bg-amber-500",
          category.tier === "relevant" && "bg-zinc-400"
        )}
        aria-hidden
      />
      {category.label}
      {showScore ? (
        <span className="font-normal tabular-nums opacity-80">{score}%</span>
      ) : null}
    </span>
  );
}
