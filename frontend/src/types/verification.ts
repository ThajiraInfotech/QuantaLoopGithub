import type { UserRole } from "./user";

export type PendingVerificationUser = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
