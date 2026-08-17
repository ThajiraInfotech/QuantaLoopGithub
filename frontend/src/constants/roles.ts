import type { UserRole } from "@/types/user";

export const USER_ROLES: readonly UserRole[] = [
  "material_provider",
  "verified_buyer",
  "admin",
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  material_provider: "Material Seller",
  verified_buyer: "Material Buyer",
  admin: "Administrator",
};
