import { cn } from "@/lib/utils";
import type { OperationalInsight } from "@/types/insight";

const TONE_STYLES: Record<OperationalInsight["tone"], string> = {
  neutral: "border-zinc-200/80 bg-white",
  positive: "border-zinc-200/80 bg-zinc-50/80",
  attention: "border-amber-200/80 bg-amber-50/40",
};

export function InsightCard({ insight }: { insight: OperationalInsight }) {
  return (
    <article
      className={cn(
        "rounded-xl border p-5 shadow-sm shadow-zinc-950/5",
        TONE_STYLES[insight.tone]
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {insight.category}
      </p>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-900">
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{insight.body}</p>
    </article>
  );
}
