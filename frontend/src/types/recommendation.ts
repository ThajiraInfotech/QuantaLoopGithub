export type RecommendationPriority = "high" | "medium" | "standard";

export type MaterialRecommendationItem = {
  materialId: string;
  title: string;
  materialType: string;
  location: string;
  providerCompany?: string;
  relevanceScore?: number;
  activityScore?: number;
  freshnessScore?: number;
  compositeScore?: number;
  priority?: RecommendationPriority;
  headline: string;
  sectionType?: string;
  matchLabel?: string;
  locationScope?: "same_city" | "same_state" | "other_state" | "unknown";
  locationNote?: string;
  sellerState?: string;
  sellerCity?: string;
};

export type ParticipantRecommendationItem = {
  participantId: string;
  companyName: string;
  location: string;
  industryType?: string;
  responseQualityScore?: number;
  responseQualityLabel?: string;
  engagementScore?: number;
  alignmentScore?: number;
  compositeScore?: number;
  priority?: RecommendationPriority;
  headline: string;
};

export type RecommendationSection<T> = {
  id: string;
  title: string;
  subtitle: string;
  items: T[];
};
