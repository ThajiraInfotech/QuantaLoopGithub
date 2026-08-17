import type { UserRole, VerificationStatus } from "@/types/user";

import { RoleBadge } from "./role-badge";

type VerificationBadgeProps = {
  role: UserRole;
  verificationStatus?: VerificationStatus;
  className?: string;
};

/** Shows participant role only — verification is not surfaced in the product UI. */
export function VerificationBadge({ role, className }: VerificationBadgeProps) {
  return <RoleBadge role={role} className={className} />;
}
