import type { User } from "@/types/user";

export function canPublishMaterial(user: User | null): boolean {
  if (!user) return false;
  return user.role === "material_provider" || user.role === "admin";
}

export function canViewMaterialWorkspace(user: User | null): boolean {
  return Boolean(user);
}
