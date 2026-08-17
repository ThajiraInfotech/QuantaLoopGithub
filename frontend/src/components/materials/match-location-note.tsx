import { cn } from "@/lib/utils";
import type { MatchLocationScope } from "@/lib/match-display";

const SCOPE_STYLES: Record<MatchLocationScope, string> = {
  same_city: "border-emerald-200 bg-emerald-50 text-emerald-800",
  same_state: "border-sky-200 bg-sky-50 text-sky-800",
  other_state: "border-amber-200 bg-amber-50 text-amber-900",
  unknown: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function MatchLocationNote({
  locationScope = "unknown",
  locationNote,
  className,
}: {
  locationScope?: MatchLocationScope;
  locationNote?: string;
  className?: string;
}) {
  if (!locationNote?.trim()) return null;

  return (
    <p
      className={cn(
        "inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-medium leading-snug",
        SCOPE_STYLES[locationScope],
        className
      )}
    >
      {locationNote}
    </p>
  );
}
