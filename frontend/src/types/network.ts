export type NetworkSpotlightEntry = {
  companyName: string;
  role: string;
};

export type NetworkOverview = {
  registeredParticipants?: number;
  verifiedParticipants: number;
  activeMaterials: number;
  recentOpportunityActivity: number;
  spotlight: NetworkSpotlightEntry[];
};
