import type { UserRole } from "@/types/user";

export function hasRole(
  userRole: UserRole | undefined,
  allowed: readonly UserRole[]
): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function isAuthenticated(accessToken: string | null | undefined): boolean {
  return Boolean(accessToken);
}
