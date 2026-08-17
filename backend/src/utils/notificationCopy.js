/**
 * Human-readable notification titles and bodies (operational language).
 */

function materialLabel(title) {
  return title?.trim() ? `“${title.trim()}”` : "this material";
}

function companyLabel(name) {
  return name?.trim() || "A company";
}

function interestReceived({ buyerCompany, materialTitle }) {
  return {
    title: "Buyer waiting for your response",
    message: `${companyLabel(buyerCompany)} is interested in ${materialLabel(materialTitle)}.`,
  };
}

function discussionStarted({ providerCompany, materialTitle }) {
  return {
    title: "Discussion started",
    message: `${companyLabel(providerCompany)} accepted your interest and started a discussion about ${materialLabel(materialTitle)}.`,
  };
}

function interestDeclined({ providerCompany, materialTitle }) {
  return {
    title: "Interest declined",
    message: `${companyLabel(providerCompany)} did not progress your interest in ${materialLabel(materialTitle)}.`,
  };
}

function pickupArranged({ materialTitle }) {
  return {
    title: "Pickup arranged",
    message: `Pickup has been arranged for ${materialLabel(materialTitle)}.`,
  };
}

function dealCompleted({ materialTitle }) {
  return {
    title: "Deal completed",
    message: `${materialLabel(materialTitle)} has been marked as completed.`,
  };
}

function opportunityClosed({ materialTitle }) {
  return {
    title: "Opportunity closed",
    message: `This opportunity for ${materialLabel(materialTitle)} was closed before completion.`,
  };
}

function newDiscussionMessage({ senderCompany }) {
  return {
    title: "New discussion message",
    message: `${companyLabel(senderCompany)} replied in your discussion.`,
  };
}

function workflowNotification(nextStatus, { materialTitle, providerCompany }) {
  switch (nextStatus) {
    case "discussion":
      return {
        title: "Discussion started",
        message: `${companyLabel(providerCompany)} moved coordination into active discussion for ${materialLabel(materialTitle)}.`,
      };
    case "pickup_scheduled":
      return pickupArranged({ materialTitle });
    case "completed":
      return dealCompleted({ materialTitle });
    case "closed":
      return opportunityClosed({ materialTitle });
    default:
      return {
        title: "Opportunity update",
        message: `There is an update on ${materialLabel(materialTitle)}.`,
      };
  }
}

function responseReminder({ materialTitle }) {
  return {
    title: "Buyer waiting for your response",
    message: `An interest on ${materialLabel(materialTitle)} has been pending for over 48 hours.`,
  };
}

function savedOpportunityActive({ materialTitle }) {
  return {
    title: "Saved opportunity updated",
    message: `A material on your watch list — ${materialLabel(materialTitle)} — was recently updated.`,
  };
}

function newMatchingMaterial({ materialTitle, materialType, location }) {
  const detail = [materialType, location].filter(Boolean).join(" · ");
  return {
    title: "New opportunity for you",
    message: detail
      ? `${materialLabel(materialTitle)} may fit your sourcing profile (${detail}).`
      : `${materialLabel(materialTitle)} may fit your sourcing profile.`,
  };
}

function introductionRequest({ providerCompany, message }) {
  return {
    title: "Introduction requested",
    message: `${companyLabel(providerCompany)}: ${message}`,
  };
}

module.exports = {
  interestReceived,
  discussionStarted,
  interestDeclined,
  pickupArranged,
  dealCompleted,
  opportunityClosed,
  newDiscussionMessage,
  workflowNotification,
  responseReminder,
  savedOpportunityActive,
  newMatchingMaterial,
  introductionRequest,
};
