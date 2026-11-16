import type { FaqItem } from "@/lib/seo";

export function asFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { question?: unknown; answer?: unknown };
      if (typeof row.question !== "string" || typeof row.answer !== "string") {
        return null;
      }
      return { question: row.question, answer: row.answer };
    })
    .filter((item): item is FaqItem => Boolean(item));
}
