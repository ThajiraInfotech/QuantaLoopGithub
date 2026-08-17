export type ReportTargetType = "participant" | "material";

export type ReportReason =
  | "misleading_information"
  | "spam"
  | "inactive_participant";

export type ReportStatus = "open" | "resolved";

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetUserId: string | null;
  targetMaterialId: string | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportPayload = {
  targetType: ReportTargetType;
  targetUserId?: string;
  targetMaterialId?: string;
  reason: ReportReason;
  details?: string;
};
