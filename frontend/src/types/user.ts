export type UserRole = "material_provider" | "verified_buyer" | "admin";

export type SignupRole = Extract<
  UserRole,
  "material_provider" | "verified_buyer"
>;

export type VerificationStatus = "unverified" | "pending" | "verified";

export type AccountStatus = "active" | "suspended";

export type User = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  role: UserRole;
  industryType: string;
  primaryIndustry: string;
  secondaryIndustries: string[];
  customIndustry: string;
  materialTypes: string[];
  preferredMaterialCategories: string[];
  requiredMaterialCategories: string[];
  industriesHandled: string[];
  location: string;
  country: string;
  stateCode: string;
  state: string;
  region: string;
  customRegion: string;
  city: string;
  companyDescription: string;
  website: string;
  operationalLocation: string;
  employeeRange: string;
  establishedYear: number | null;
  responseRate: number;
  averageResponseTime: string;
  profileCompletion: number;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  accountStatus?: AccountStatus;
  emailVerified?: boolean;
  googleEmailVerified?: boolean;
  hasLocalPassword?: boolean;
  authProvider?: "local" | "google";
  createdAt: string;
  updatedAt: string;
};
