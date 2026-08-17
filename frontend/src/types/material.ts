export type AvailabilityFrequency =
  | "one_time"
  | "daily"
  | "weekly"
  | "monthly";

/** API returns canonical labels; legacy active/inactive may still appear during migration. */
export type MaterialStatus =
  | "available"
  | "in_discussion"
  | "fulfilled"
  | "archived"
  | "active"
  | "inactive";

export type MaterialVisibility = "network" | "restricted";

export type MaterialMarketScope = "india" | "global";

export type MaterialProviderSummary = {
  id: string;
  companyName: string;
  name: string;
  email: string;
  industryType?: string;
  location?: string;
};

export type Material = {
  id: string;
  title: string;
  materialType: string;
  materialSubtype: string;
  materialForm: string;
  cleanliness: string;
  description: string;
  quantity: number;
  unit: string;
  location: string;
  country: string;
  marketScope: MaterialMarketScope;
  availabilityFrequency: AvailabilityFrequency;
  status: MaterialStatus;
  provider: MaterialProviderSummary;
  industryType: string;
  pickupAvailable: boolean;
  estimatedValueRange: string;
  visibility: MaterialVisibility;
  interestedBuyerIds: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
};
