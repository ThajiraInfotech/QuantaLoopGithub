import type { InterestStatus } from "@/types/interest";
import type { Notification } from "@/types/notification";

export type NotificationContext = {
  buyer: string | null;
  provider: string | null;
  material: string | null;
  status: string | null;
  sender: string | null;
};

const PROVIDER_FACING_TYPES = new Set<Notification["type"]>([
  "interest_received",
  "response_reminder",
]);

const BUYER_FACING_TYPES = new Set<Notification["type"]>([
  "interest_accepted",
  "interest_rejected",
  "interest_workflow_update",
  "coordination_follow_up",
]);

function parseLegacyMessage(message: string): Partial<NotificationContext> {
  const interested = message.match(
    /^(.+?) is interested in [“"](.+?)[”"]\./
  );
  if (interested) {
    return { buyer: interested[1].trim(), material: interested[2].trim() };
  }

  const signaled = message.match(
    /^(.+?) signaled interest on [“"](.+?)[”"]\./
  );
  if (signaled) {
    return { buyer: signaled[1].trim(), material: signaled[2].trim() };
  }

  const replied = message.match(/^(.+?) replied in your discussion\./);
  if (replied) {
    return { sender: replied[1].trim() };
  }

  const accepted = message.match(
    /^(.+?) accepted your interest and started a discussion/
  );
  if (accepted) {
    return { buyer: null, material: null, sender: accepted[1].trim() };
  }

  const materialQuoted = message.match(/[“"](.+?)[”"]/);
  if (materialQuoted) {
    return { material: materialQuoted[1].trim() };
  }

  return {};
}

export function getNotificationContext(
  notification: Notification
): NotificationContext {
  const legacy = parseLegacyMessage(notification.message ?? "");

  const introFrom =
    notification.type === "introduction_request"
      ? notification.message.split(":")[0]?.trim()
      : null;

  const buyer =
    notification.buyerCompany?.trim() || legacy.buyer || null;

  const provider =
    notification.providerCompany?.trim() ||
    legacy.sender ||
    extractSenderFromMessage(notification.message) ||
    introFrom ||
    null;

  const material =
    notification.materialTitle?.trim() || legacy.material || null;

  const status =
    notification.opportunityStatusLabel?.trim() ||
    (notification.relatedInterestStatus
      ? statusLabelFromInterest(notification.relatedInterestStatus)
      : null);

  const showBuyer = PROVIDER_FACING_TYPES.has(notification.type);
  const showProvider =
    BUYER_FACING_TYPES.has(notification.type) ||
    notification.type === "introduction_request";

  return {
    buyer: showBuyer ? buyer : null,
    provider: showProvider ? provider : null,
    material,
    status,
    sender: null,
  };
}

function extractSenderFromMessage(message: string): string | null {
  const replied = message.match(/^(.+?) replied in your discussion\./);
  return replied ? replied[1].trim() : null;
}

export function statusLabelFromInterest(status: InterestStatus): string {
  switch (status) {
    case "pending":
      return "Pending your response";
    case "accepted":
      return "Interest accepted";
    case "rejected":
      return "Interest declined";
    case "discussion":
      return "In discussion";
    case "pickup_scheduled":
      return "Pickup arranged";
    case "completed":
      return "Completed";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export function groupSubline(notification: Notification): string {
  const ctx = getNotificationContext(notification);
  const buyer = ctx.buyer ?? "Buyer";
  const material = ctx.material ?? "Material";
  return `${buyer} → ${material}`;
}
