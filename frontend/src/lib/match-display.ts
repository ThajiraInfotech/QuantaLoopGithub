export type MatchLocationScope =
  | "same_city"
  | "same_state"
  | "other_state"
  | "unknown";

export type MaterialMatchMeta = {
  score: number;
  matchLabel?: string;
  locationScope?: MatchLocationScope;
  locationNote?: string;
};

export function isMaterialFeedItem(
  x: unknown
): x is {
  materialId: string;
  compositeScore?: number;
  score?: number;
  matchLabel?: string;
  locationScope?: MatchLocationScope;
  locationNote?: string;
  headline?: string;
} {
  return (
    typeof x === "object" &&
    x !== null &&
    "materialId" in x &&
    typeof (x as { materialId: unknown }).materialId === "string"
  );
}

export function buildMaterialMatchMetaMap(
  matchBlock: unknown,
  feedSections: { id: string; items?: unknown[] }[]
): Map<string, MaterialMatchMeta> {
  const scores = new Map<string, MaterialMatchMeta>();

  function upsert(
    materialId: string,
    next: Partial<MaterialMatchMeta> & { score?: number }
  ) {
    const existing = scores.get(materialId);
    const score = Math.max(existing?.score ?? 0, next.score ?? 0);
    scores.set(materialId, {
      score,
      matchLabel: next.matchLabel ?? existing?.matchLabel,
      locationScope: next.locationScope ?? existing?.locationScope,
      locationNote: next.locationNote ?? existing?.locationNote,
    });
  }

  for (const section of feedSections) {
    for (const item of section.items?.filter(isMaterialFeedItem) ?? []) {
      const score = item.compositeScore ?? item.score;
      if (typeof score !== "number") continue;
      upsert(item.materialId, {
        score,
        matchLabel: item.matchLabel,
        locationScope: item.locationScope,
        locationNote: item.locationNote,
      });
    }
  }

  if (
    matchBlock &&
    typeof matchBlock === "object" &&
    matchBlock !== null &&
    "items" in matchBlock &&
    Array.isArray((matchBlock as { items: unknown }).items)
  ) {
    for (const raw of (matchBlock as { items: unknown[] }).items) {
      if (!isMaterialFeedItem(raw)) continue;
      const score = raw.compositeScore ?? raw.score;
      if (typeof score !== "number") continue;
      upsert(raw.materialId, {
        score,
        matchLabel: raw.matchLabel,
        locationScope: raw.locationScope,
        locationNote: raw.locationNote,
      });
    }
  }

  return scores;
}
