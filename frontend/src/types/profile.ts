import type { User } from "./user";

export type TrustSignals = {
  activeMaterials: number;
  recentInboundInterests: number;
  recentOutboundInterests: number;
  recentResolvedInterests: number;
  labels: string[];
};

export type ProfileWithTrust = {
  profile: User;
  trustSignals: TrustSignals;
};
