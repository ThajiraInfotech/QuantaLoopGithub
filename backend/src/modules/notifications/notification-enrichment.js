const mongoose = require("mongoose");
const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");

const INTEREST_STATUS_LABELS = {
  pending: "Pending your response",
  accepted: "Interest accepted",
  rejected: "Interest declined",
  discussion: "In discussion",
  pickup_scheduled: "Pickup arranged",
  completed: "Completed",
  closed: "Closed",
};

async function enrichNotificationsWithContext(items) {
  const interestIds = [
    ...new Set(
      items
        .map((i) => i.relatedInterestId)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    ),
  ];

  const materialIds = [
    ...new Set(
      items
        .filter((i) => i.relatedMaterialId && !i.relatedInterestId)
        .map((i) => i.relatedMaterialId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    ),
  ];

  const interestMap = new Map();
  if (interestIds.length > 0) {
    const interests = await Interest.find({ _id: { $in: interestIds } })
      .populate("buyer", "companyName name")
      .populate("provider", "companyName name")
      .populate("material", "title")
      .select("status buyer provider material")
      .lean();

    for (const row of interests) {
      interestMap.set(row._id.toString(), row);
    }
  }

  const materialMap = new Map();
  if (materialIds.length > 0) {
    const materials = await Material.find({ _id: { $in: materialIds } })
      .select("title")
      .lean();
    for (const row of materials) {
      materialMap.set(row._id.toString(), row);
    }
  }

  return items.map((item) => {
    const next = { ...item };

    if (item.relatedInterestId) {
      const interest = interestMap.get(item.relatedInterestId);
      if (interest) {
        next.relatedInterestStatus = interest.status;
        next.buyerCompany =
          interest.buyer?.companyName ?? interest.buyer?.name ?? null;
        next.providerCompany =
          interest.provider?.companyName ?? interest.provider?.name ?? null;
        next.materialTitle =
          interest.material?.title ?? next.materialTitle ?? null;
        next.opportunityStatusLabel =
          INTEREST_STATUS_LABELS[interest.status] ?? interest.status;
      }
    }

    if (
      item.relatedMaterialId &&
      !next.materialTitle &&
      materialMap.has(item.relatedMaterialId)
    ) {
      next.materialTitle = materialMap.get(item.relatedMaterialId).title ?? null;
    }

    return next;
  });
}

const TERMINAL_INTEREST_STATUSES = new Set(["completed", "closed", "rejected"]);

/**
 * Unread items that still need user action (sidebar badge + Action required section).
 */
function isActionableNotification(notification) {
  if (notification.isRead) return false;

  if (
    notification.relatedInterestStatus &&
    TERMINAL_INTEREST_STATUSES.has(notification.relatedInterestStatus)
  ) {
    return false;
  }

  switch (notification.type) {
    case "interest_received":
    case "response_reminder":
      return (
        !notification.relatedInterestStatus ||
        notification.relatedInterestStatus === "pending"
      );
    case "coordination_follow_up":
      return true;
    default:
      return false;
  }
}

function countActionableUnread(items) {
  return items.filter((n) => isActionableNotification(n)).length;
}

module.exports = {
  enrichNotificationsWithContext,
  INTEREST_STATUS_LABELS,
  isActionableNotification,
  countActionableUnread,
};
