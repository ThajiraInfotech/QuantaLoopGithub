import type { AvailabilityFrequency, MaterialStatus } from "@/types/material";

export const AVAILABILITY_LABELS: Record<AvailabilityFrequency, string> = {
  one_time: "One-time availability",
  daily: "Daily rhythm",
  weekly: "Weekly rhythm",
  monthly: "Monthly rhythm",
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  available: "Available",
  in_discussion: "In discussion",
  fulfilled: "Fulfilled",
  archived: "Archived",
  active: "Available (legacy)",
  inactive: "Archived (legacy)",
};
