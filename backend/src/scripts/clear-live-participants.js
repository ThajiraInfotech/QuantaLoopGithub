/**
 * LIVE-safe wipe of buyers/providers for a clean client UAT.
 * Keeps admin accounts. Deletes participant users and related product data.
 *
 * Usage on VPS (from backend/):
 *   CLEAR_LIVE_PARTICIPANTS_CONFIRM=YES node src/scripts/clear-live-participants.js
 *
 * Optional:
 *   --keep-invoices   do not delete invoices / billing profiles / counters
 */
require("dotenv").config();

const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");

const { User } = require("../modules/users/user.model");
const { Material } = require("../modules/materials/material.model");
const { Interest } = require("../modules/interests/interest.model");
const { Conversation } = require("../modules/conversations/conversation.model");
const { Message } = require("../modules/messages/message.model");
const { SavedMaterial } = require("../modules/saved-materials/saved-material.model");
const { Notification } = require("../modules/notifications/notification.model");
const { Report } = require("../modules/reports/report.model");
const { Reminder } = require("../modules/reminders/reminder.model");
const { TimelineEvent } = require("../modules/timeline/timeline.model");
const {
  IntroductionRequest,
} = require("../modules/network/introduction.model");
const { Subscription } = require("../modules/subscriptions/subscription.model");
const {
  WebhookEvent,
} = require("../modules/subscriptions/webhook-event.model");
const {
  BillingProfile,
} = require("../modules/billing/billing-profile.model");
const { Invoice } = require("../modules/billing/invoice.model");
const { InvoiceCounter } = require("../modules/billing/invoice-counter.model");

const PARTICIPANT_ROLES = ["material_provider", "verified_buyer"];

function assertLiveClearConfirmed() {
  if (process.env.CLEAR_LIVE_PARTICIPANTS_CONFIRM !== "YES") {
    throw new Error(
      "Refusing to run. Set CLEAR_LIVE_PARTICIPANTS_CONFIRM=YES to wipe live participants."
    );
  }
}

async function main() {
  assertLiveClearConfirmed();
  const keepInvoices = process.argv.includes("--keep-invoices");

  await connectSeedDatabase();

  const admins = await User.find({ role: "admin" }).select("_id email").lean();
  if (!admins.length) {
    throw new Error(
      "No admin users found. Aborting so you are not locked out of /admin."
    );
  }

  const participants = await User.find({ role: { $in: PARTICIPANT_ROLES } })
    .select("_id email role")
    .lean();
  const participantIds = participants.map((p) => p._id);

  process.stdout.write(
    `\nLIVE CLEAR: removing ${participantIds.length} participant(s). Keeping ${admins.length} admin(s):\n`
  );
  for (const admin of admins) {
    process.stdout.write(`  - ${admin.email}\n`);
  }
  process.stdout.write("\n");

  const materialIds = (await Material.find({}).select("_id").lean()).map(
    (m) => m._id
  );
  const interestIds = (
    await Interest.find({
      $or: [
        { buyer: { $in: participantIds } },
        { provider: { $in: participantIds } },
      ],
    })
      .select("_id")
      .lean()
  ).map((i) => i._id);
  const conversationIds = (
    await Conversation.find({
      $or: [
        { buyer: { $in: participantIds } },
        { provider: { $in: participantIds } },
      ],
    })
      .select("_id")
      .lean()
  ).map((c) => c._id);

  const steps = [
    {
      name: "Razorpay webhook events",
      run: () => WebhookEvent.deleteMany({}),
    },
    {
      name: "subscriptions",
      run: () => Subscription.deleteMany({}),
    },
    {
      name: "messages",
      run: () =>
        Message.deleteMany({
          $or: [
            { sender: { $in: participantIds } },
            { conversation: { $in: conversationIds } },
          ],
        }),
    },
    {
      name: "timeline events",
      run: () =>
        TimelineEvent.deleteMany({
          $or: [
            { actor: { $in: participantIds } },
            { material: { $in: materialIds } },
            { interest: { $in: interestIds } },
            { conversation: { $in: conversationIds } },
            { audienceUsers: { $in: participantIds } },
          ],
        }),
    },
    {
      name: "reminders",
      run: () =>
        Reminder.deleteMany({
          $or: [
            { user: { $in: participantIds } },
            { relatedMaterial: { $in: materialIds } },
            { relatedInterest: { $in: interestIds } },
            { relatedConversation: { $in: conversationIds } },
          ],
        }),
    },
    {
      name: "notifications",
      run: () =>
        Notification.deleteMany({
          $or: [
            { recipient: { $in: participantIds } },
            { relatedMaterial: { $in: materialIds } },
            { relatedInterest: { $in: interestIds } },
          ],
        }),
    },
    {
      name: "reports",
      run: () => Report.deleteMany({}),
    },
    {
      name: "saved materials",
      run: () =>
        SavedMaterial.deleteMany({
          $or: [
            { buyer: { $in: participantIds } },
            { material: { $in: materialIds } },
          ],
        }),
    },
    {
      name: "introduction requests",
      run: () =>
        IntroductionRequest.deleteMany({
          $or: [
            { provider: { $in: participantIds } },
            { buyer: { $in: participantIds } },
          ],
        }),
    },
    {
      name: "conversations",
      run: () => Conversation.deleteMany({ _id: { $in: conversationIds } }),
    },
    {
      name: "interests",
      run: () => Interest.deleteMany({ _id: { $in: interestIds } }),
    },
    {
      name: "materials",
      run: () => Material.deleteMany({}),
    },
  ];

  if (!keepInvoices) {
    steps.push(
      {
        name: "billing profiles",
        run: () => BillingProfile.deleteMany({}),
      },
      {
        name: "invoices",
        run: () => Invoice.deleteMany({}),
      },
      {
        name: "invoice counters",
        run: () => InvoiceCounter.deleteMany({}),
      }
    );
  }

  steps.push({
    name: "participant users",
    run: () => User.deleteMany({ _id: { $in: participantIds } }),
  });

  for (const step of steps) {
    const result = await step.run();
    process.stdout.write(`  ${step.name}: ${result.deletedCount} deleted\n`);
  }

  const remaining = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  process.stdout.write("\nRemaining users by role:\n");
  for (const row of remaining) {
    process.stdout.write(`  ${row._id}: ${row.count}\n`);
  }
  process.stdout.write(
    `\nAdmin login(s) kept: ${admins.map((a) => a.email).join(", ")}\n`
  );
  process.stdout.write(
    "Done. Client can register fresh accounts and start the 30-day trial.\n"
  );

  await disconnectSeedDatabase();
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
