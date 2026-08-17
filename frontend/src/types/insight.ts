export type InsightTone = "neutral" | "positive" | "attention";

export type OperationalInsight = {
  id: string;
  category: string;
  title: string;
  body: string;
  tone: InsightTone;
  meta?: Record<string, unknown>;
};

export type ActivitySignalsSummary = {
  engagementScore: number;
  responseQuality: { score: number; label: string } | null;
  refreshedAt: string;
};
