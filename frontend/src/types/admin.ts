import type { User, UserRole } from "./user";

export type AccountStatus = "active" | "suspended";

export type AdminKpis = {
  participants: number;
  materials: number;
  activeDeals: number;
  completedDeals: number;
  participantsGrowthPct: number;
  materialsGrowthPct: number;
};

export type AdminActionRequired = {
  openReports: number;
  openSupportRequests: number;
  interestsWaiting48h: number;
  inactiveDiscussions7d: number;
  recentlySuspended: number;
};

export type AdminPlatformActivity = {
  newParticipantsThisWeek: number;
  newMaterialsPublished: number;
  interestsCreated: number;
  dealsCompleted: number;
};

export type AdminDealFunnel = {
  interestCreated: number;
  discussionStarted: number;
  pickupScheduled: number;
  completed: number;
};

export type AdminRecentParticipant = {
  id: string;
  name: string;
  companyName: string;
  role: UserRole;
  createdAt: string;
};

export type AdminReportIssue = {
  id: string;
  reportRefId?: string;
  targetType: "participant" | "material";
  targetUserId: string | null;
  targetMaterialId: string | null;
  targetLabel: string;
  reporterId?: string;
  reporterName?: string;
  reporterCompany?: string;
  reason: string;
  details: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  status?: "open" | "resolved";
};

export type AdminReportSummary = {
  total: number;
  open: number;
  resolved: number;
  material: number;
  participant: number;
};

export type AdminReportReporterOption = {
  id: string;
  name: string;
  companyName: string;
};

export type AdminReportsResult = {
  items: AdminReportIssue[];
  total: number;
  page: number;
  limit: number;
  summary: AdminReportSummary;
  reporters: AdminReportReporterOption[];
};

export type AdminReportDetail = {
  report: AdminReportIssue;
  reporter: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
    createdAt: string;
  } | null;
  target:
    | {
        type: "participant";
        id: string;
        name: string;
        companyName: string;
        email: string;
        role: UserRole;
        accountStatus: AccountStatus;
        createdAt: string;
      }
    | {
        type: "material";
        id: string;
        lotId: string;
        title: string;
        materialType: string;
        location: string;
        status: string;
        quantity: number;
        unit: string;
        provider: {
          id: string;
          name: string;
          companyName: string;
          role: UserRole;
          accountStatus: AccountStatus;
        } | null;
      }
    | null;
  resolution: {
    status: "open" | "resolved";
    resolvedAt: string | null;
    resolvedById: string | null;
    resolvedByName: string | null;
    resolvedByCompany: string | null;
  };
  history: Array<{
    type: string;
    label: string;
    occurredAt: string;
    actorName?: string;
    detail?: string;
  }>;
};

export type AdminSupportRequestIssue = {
  id: string;
  supportRefId?: string;
  name: string;
  email: string;
  category: string;
  description: string;
  companyName: string;
  source: string;
  pageUrl: string;
  userId: string | null;
  status: "open" | "resolved";
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AdminSupportRequestSummary = {
  total: number;
  open: number;
  resolved: number;
};

export type AdminSupportRequestsResult = {
  items: AdminSupportRequestIssue[];
  total: number;
  page: number;
  limit: number;
  summary: AdminSupportRequestSummary;
};

export type AdminSupportRequestDetail = {
  request: AdminSupportRequestIssue;
  linkedUser: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
    createdAt: string;
  } | null;
  resolution: {
    status: "open" | "resolved";
    resolvedAt: string | null;
    resolvedById: string | null;
    resolvedByName: string | null;
    resolvedByCompany: string | null;
  };
  history: Array<{
    type: string;
    label: string;
    occurredAt: string;
    actorName?: string;
  }>;
};

export type AdminInactiveDiscussion = {
  id: string;
  materialTitle: string;
  lastMessageAt: string | null;
  updatedAt: string;
};

export type AdminDashboardData = {
  kpis: AdminKpis;
  actionRequired: AdminActionRequired;
  platformActivity: AdminPlatformActivity;
  dealFunnel: AdminDealFunnel;
  recentParticipants: AdminRecentParticipant[];
  recentIssues: {
    openReports: AdminReportIssue[];
    inactiveDiscussions: AdminInactiveDiscussion[];
  };
};

export type AdminParticipantSummary = {
  total: number;
  providers: number;
  buyers: number;
  suspended: number;
  paid?: number;
  trialActive?: number;
  trialEnded?: number;
  withAccess?: number;
};

export type AdminMembershipStatus =
  | "paid"
  | "trial_active"
  | "trial_ended"
  | "no_trial";

export type AdminParticipantRow = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  membershipStatus?: AdminMembershipStatus;
  trialEndsAt?: string | null;
  createdAt: string;
  lastActivityAt: string;
};

export type AdminParticipantsResult = {
  items: AdminParticipantRow[];
  total: number;
  page: number;
  limit: number;
  summary: AdminParticipantSummary;
};

export type AdminParticipantActivity = {
  materialsPublished: number;
  interestsCreated: number;
  interestsReceived: number;
  activeDiscussions: number;
  completedDeals: number;
  totalDiscussions: number;
};

export type AdminParticipantAccountHealth = {
  lastActivityAt: string;
  lastLoginAt: string | null;
  loginCount: number;
};

export type AdminParticipantRecentActivityType =
  | "material_created"
  | "interest_created"
  | "interest_received"
  | "message_sent"
  | "logged_in";

export type AdminParticipantRecentActivity = {
  type: AdminParticipantRecentActivityType;
  description: string;
  occurredAt: string;
  relatedId: string | null;
  relatedType: "material" | "interest" | "conversation" | "user";
};

export type AdminParticipantNavigation = {
  latestInterestId: string | null;
  latestConversationId: string | null;
};

export type AdminParticipantProfile = User & {
  phone: string;
  jobTitle: string;
  /** Admin-only legal consent proof */
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
};

export type AdminParticipantDetail = {
  profile: AdminParticipantProfile;
  membership?: {
    status: AdminMembershipStatus;
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    trialConsumed: boolean;
  };
  accountHealth: AdminParticipantAccountHealth;
  activity: AdminParticipantActivity;
  recentActivity: AdminParticipantRecentActivity[];
  navigation: AdminParticipantNavigation;
};

export type AdminMaterialSummary = {
  total: number;
  available: number;
  inDiscussion: number;
  completed: number;
  reported: number;
};

export type AdminMaterialProviderBrief = {
  id: string;
  companyName: string;
  name: string;
  accountStatus: AccountStatus;
};

export type AdminMaterialRow = {
  id: string;
  lotId: string;
  title: string;
  materialType: string;
  quantity: number;
  unit: string;
  location: string;
  status: string;
  visibility: string;
  provider: AdminMaterialProviderBrief | null;
  interestCount: number;
  reportCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminMaterialProviderOption = {
  id: string;
  companyName: string;
  name: string;
  accountStatus: AccountStatus;
};

export type AdminMaterialsResult = {
  items: AdminMaterialRow[];
  total: number;
  page: number;
  limit: number;
  summary: AdminMaterialSummary;
  materialTypes: string[];
  providers: AdminMaterialProviderOption[];
};

export type AdminMaterialDetailReport = {
  id: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
};

export type AdminMaterialDetail = {
  material: {
    id: string;
    lotId: string;
    title: string;
    materialType: string;
    description: string;
    quantity: number;
    unit: string;
    location: string;
    availabilityFrequency: string;
    status: string;
    visibility: string;
    industryType: string;
    pickupAvailable: boolean;
    estimatedValueRange: string;
    imageUrls: string[];
    createdAt: string;
    updatedAt: string;
  };
  provider: {
    id: string;
    companyName: string;
    name: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
    industryType: string;
    location: string;
    createdAt: string;
    lastActivityAt: string;
  };
  activity: {
    interestCount: number;
    discussionCount: number;
    reportCount: number;
    lastActivityAt: string;
  };
  reports: AdminMaterialDetailReport[];
  reportHistory: AdminMaterialDetailReport[];
};

export type AdminInterestSummary = {
  total: number;
  pending: number;
  inDiscussion: number;
  completed: number;
  reported: number;
};

export type AdminInterestParticipantBrief = {
  id: string;
  companyName: string;
  name: string;
  accountStatus: AccountStatus;
};

export type AdminInterestMaterialBrief = {
  id: string;
  title: string;
  lotId: string;
  materialType: string;
  location: string;
  status: string;
};

export type AdminInterestRow = {
  id: string;
  interestRefId: string;
  status: string;
  buyer: AdminInterestParticipantBrief | null;
  provider: AdminInterestParticipantBrief | null;
  material: AdminInterestMaterialBrief | null;
  messageCount: number;
  reportCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  conversationId: string | null;
};

export type AdminInterestsResult = {
  items: AdminInterestRow[];
  total: number;
  page: number;
  limit: number;
  summary: AdminInterestSummary;
  materialTypes: string[];
  buyers: AdminInterestParticipantBrief[];
  providers: AdminInterestParticipantBrief[];
};

export type AdminInterestMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderCompany: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
};

export type AdminInterestReport = {
  id: string;
  reason: string;
  details: string;
  status: string;
  targetType: string;
  createdAt: string;
  resolvedAt?: string | null;
};

export type AdminInterestDetail = {
  interest: {
    id: string;
    interestRefId: string;
    status: string;
    message: string;
    pickupTimeline: string;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    conversationId: string | null;
  };
  buyer: AdminInterestParticipantBrief & {
    email: string;
    role: UserRole;
    createdAt: string;
    lastActivityAt: string;
  };
  provider: AdminInterestParticipantBrief & {
    email: string;
    role: UserRole;
    createdAt: string;
    lastActivityAt: string;
  };
  material: AdminInterestMaterialBrief & {
    quantity: number;
    unit: string;
    description: string;
  };
  activity: {
    messageCount: number;
    discussionStatus: string;
    firstContactAt: string | null;
    lastActivityAt: string;
  };
  conversation: {
    id: string;
    status: string;
    lastMessageAt: string | null;
    buyerId: string;
    providerId: string;
  } | null;
  messages: AdminInterestMessage[];
  reports: {
    open: AdminInterestReport[];
    resolved: AdminInterestReport[];
    history: AdminInterestReport[];
  };
};
