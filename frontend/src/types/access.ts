export type AccessTier = {
  id: string;
  name: string;
  positioning: string;
  highlight: string;
};

export type AccessPlansPayload = {
  tiers: AccessTier[];
  anchor: {
    headline: string;
    subtext: string;
    annualInr: number;
    dailyInrApprox: number;
    rationale: string;
  };
};
