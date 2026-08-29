export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  onboardingRole: "/onboarding/role-selection",
  onboardingIndustry: "/onboarding/industry",
  onboardingMaterials: "/onboarding/materials",
  onboardingLocation: "/onboarding/location",
  onboardingAccount: "/onboarding/account",
  onboardingMembership: "/onboarding/membership",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  participantProfile: (id: string) => `/dashboard/participants/${id}`,
  network: "/dashboard/network",
  materials: "/dashboard/materials",
  materialsNew: "/dashboard/materials/new",
  materialDetail: (id: string) => `/dashboard/materials/${id}`,
  materialEdit: (id: string) => `/dashboard/materials/${id}/edit`,
  interests: "/dashboard/interests",
  interestsHistory: "/dashboard/interests?history=1",
  interestsOpen: (interestId: string) =>
    `/dashboard/interests?open=${encodeURIComponent(interestId)}`,
  interestsStale48h: "/dashboard/interests?filter=stale48h",
  interestsInactive7d: "/dashboard/interests?filter=inactive7d",
  interestsActive: "/dashboard/interests?filter=active",
  interestsCompleted: "/dashboard/interests?filter=completed",
  conversations: "/dashboard/conversations",
  conversationDetail: (id: string) => `/dashboard/conversations/${id}`,
  saved: "/dashboard/saved",
  activity: "/dashboard/activity",
  recommendations: "/dashboard/recommendations",
  insights: "/dashboard/insights",
  notifications: "/dashboard/notifications",
  admin: "/admin",
  adminParticipants: "/admin/participants",
  adminParticipantDetail: (id: string) => `/admin/participants/${id}`,
  adminReports: "/admin/reports",
  adminReportDetail: (id: string) => `/admin/reports/${id}`,
  adminSupport: "/admin/support",
  adminSupportDetail: (id: string) => `/admin/support/${id}`,
  adminMaterials: "/admin/materials",
  adminMaterialDetail: (id: string) => `/admin/materials/${id}`,
  adminInterests: "/admin/interests",
  adminInterestsPending: "/admin/interests?status=pending",
  adminInterestsInDiscussion: "/admin/interests?status=in_discussion",
  adminInterestsCompleted: "/admin/interests?status=completed",
  adminInterestsReported: "/admin/interests?reportedOnly=true",
  adminDiscussions: "/admin/discussions",
  adminInvoices: "/admin/invoices",
  adminSecurity: "/admin/security",
  adminMaterialsForParticipant: (id: string) =>
    `/admin/materials?participant=${encodeURIComponent(id)}`,
  adminInterestsForParticipant: (
    id: string,
    scope?: "created" | "received" | "completed"
  ) => {
    const params = new URLSearchParams({ participant: id });
    if (scope) params.set("scope", scope);
    return `/admin/interests?${params.toString()}`;
  },
  adminDiscussionsForParticipant: (
    id: string,
    status?: "active" | "all"
  ) => {
    const params = new URLSearchParams({ participant: id });
    if (status && status !== "all") params.set("status", status);
    return `/admin/discussions?${params.toString()}`;
  },
  adminReportsForParticipant: (id: string) =>
    `/admin/reports?participant=${encodeURIComponent(id)}`,
  adminReportsForReporter: (id: string) =>
    `/admin/reports?reporter=${encodeURIComponent(id)}`,
  adminReportsForMaterial: (id: string) =>
    `/admin/reports?material=${encodeURIComponent(id)}`,
  adminInterestsForMaterial: (id: string) =>
    `/admin/interests?material=${encodeURIComponent(id)}`,
  adminInterestDetail: (id: string) => `/admin/interests/${id}`,
  adminReportsForInterest: (id: string) =>
    `/admin/reports?interest=${encodeURIComponent(id)}`,
  adminDiscussionsForMaterial: (id: string) =>
    `/admin/discussions?material=${encodeURIComponent(id)}`,
  legalTerms: "/legal/terms-and-conditions",
  legalPrivacy: "/legal/privacy-policy",
  contact: "/contact",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
} as const;
