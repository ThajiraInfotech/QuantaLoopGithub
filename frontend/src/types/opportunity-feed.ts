export type OpportunityFeedSection = {
  id: string;
  title: string;
  subtitle: string;
  items?: unknown[];
  metrics?: {
    windowDays: number;
    averageResponseHours: number | null;
    activeResponseRatePct: number | null;
    recentEngagementScore: number;
  };
};
