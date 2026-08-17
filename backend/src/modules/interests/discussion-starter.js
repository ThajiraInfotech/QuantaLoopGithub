const { Message } = require("../messages/message.model");
const { User } = require("../users/user.model");
const { appendTimelineEvent } = require("../timeline/timeline.service");

/**
 * Seeds the first message when a provider accepts and opens discussion.
 */
async function seedDiscussionStarterMessage(conversation, interest) {
  const buyer = await User.findById(interest.buyer)
    .select("companyName name")
    .lean();
  const buyerCompany = buyer?.companyName?.trim() || buyer?.name?.trim() || "Buyer";
  const timeline = (interest.pickupTimeline ?? "").trim();
  const originalMessage = (interest.message ?? "").trim();

  let content;
  let isSystem = false;

  if (originalMessage) {
    content = originalMessage;
  } else if (timeline) {
    isSystem = true;
    content = `${buyerCompany} expressed interest in this material. Requested pickup timeline: ${timeline}.`;
  } else {
    isSystem = true;
    content = `${buyerCompany} expressed interest in this material.`;
  }

  const msg = await Message.create({
    conversation: conversation._id,
    sender: interest.buyer,
    content,
    isSystem,
    attachments: [],
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  const providerId = conversation.provider.toString();
  const buyerId = conversation.buyer.toString();

  await appendTimelineEvent({
    type: "message_posted",
    summary: isSystem
      ? "Discussion opened with coordination context."
      : "Buyer message carried into the discussion thread.",
    actor: interest.buyer,
    material: conversation.material,
    interest: conversation.interest,
    conversation: conversation._id,
    audienceUserIds: [providerId, buyerId],
    meta: { messageId: msg._id.toString(), seeded: true },
  });

  return msg;
}

module.exports = { seedDiscussionStarterMessage };
