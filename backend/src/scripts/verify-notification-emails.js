/**
 * Verify in-app + email notifications (match 75%+ and interest alert).
 *
 * Usage:
 *   node src/scripts/verify-notification-emails.js
 *   node src/scripts/verify-notification-emails.js --email=you@gmail.com
 *
 * Optional env: NOTIFICATION_TEST_EMAIL=you@gmail.com
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");
const { User } = require("../modules/users/user.model");
const { Material } = require("../modules/materials/material.model");
const { Notification } = require("../modules/notifications/notification.model");
const {
  configureNotificationEmails,
  createNotification,
} = require("../modules/notifications/notification.service");
const { notifyBuyersOfNewMaterial } = require("../modules/matches/match.service");
const { scoreMaterialForBuyer } = require("../modules/matches/mvp-match.service");
const { newMatchingMaterial, interestReceived } = require("../utils/notificationCopy");
const { isEmailConfigured } = require("../services/email/email.service");

const RUN_ID = Date.now().toString(36);
const PASSWORD = "NotifyTest123!";

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanup(ids) {
  if (ids.notifications?.length) {
    await Notification.deleteMany({ _id: { $in: ids.notifications } });
  }
  if (ids.materials?.length) {
    await Notification.deleteMany({ relatedMaterial: { $in: ids.materials } });
    await Material.deleteMany({ _id: { $in: ids.materials } });
  }
  if (ids.users?.length) {
    await Notification.deleteMany({ recipient: { $in: ids.users } });
    await User.deleteMany({ _id: { $in: ids.users } });
  }
  if (ids.cleanupNotificationIds?.length) {
    await Notification.deleteMany({ _id: { $in: ids.cleanupNotificationIds } });
  }
}

async function main() {
  const ids = { users: [], materials: [], notifications: [], cleanupNotificationIds: [] };
  const env = await connectSeedDatabase();
  configureNotificationEmails(env);

  const overrideEmail =
    parseArg("email") || process.env.NOTIFICATION_TEST_EMAIL || "";

  section("Email configuration");
  console.log("NODE_ENV:", env.NODE_ENV);
  console.log("CLIENT_ORIGIN:", env.CLIENT_ORIGIN);
  console.log("SMTP configured:", isEmailConfigured(env));
  if (overrideEmail) console.log("Test inbox override:", overrideEmail);

  const hash = await bcrypt.hash(PASSWORD, 12);

  section("Create test provider + buyer");
  const provider = await User.create({
    name: "Notify Test Provider",
    companyName: `Notify Provider ${RUN_ID}`,
    email: `notify-provider-${RUN_ID}@test.local`,
    password: hash,
    role: "material_provider",
    emailVerified: true,
    preferredMaterialCategories: ["Plastic Waste"],
    materialTypes: ["Plastic Waste"],
    state: "Tamil Nadu",
    stateCode: "TN",
    location: "Chennai",
    country: "IN",
  });
  ids.users.push(provider._id);

  let buyer;
  if (overrideEmail) {
    buyer = await User.findOne({ email: overrideEmail.toLowerCase() });
    if (!buyer) {
      throw new Error(`No user found for --email=${overrideEmail}`);
    }
    console.log("Using existing buyer:", buyer.email);
  } else {
    buyer = await User.create({
      name: "Notify Test Buyer",
      companyName: `Notify Buyer ${RUN_ID}`,
      email: `notify-buyer-${RUN_ID}@test.local`,
      password: hash,
      role: "verified_buyer",
      emailVerified: true,
      requiredMaterialCategories: ["Plastic Waste"],
      materialTypes: ["Plastic Waste"],
      state: "Tamil Nadu",
      stateCode: "TN",
      location: "Coimbatore",
      country: "IN",
    });
    ids.users.push(buyer._id);
    console.log("Buyer email:", buyer.email);
  }

  // Ensure buyer profile can score 75%+ for Plastic Waste in Tamil Nadu.
  if (
    overrideEmail &&
    (!buyer.requiredMaterialCategories?.includes("Plastic Waste") ||
      buyer.role !== "verified_buyer")
  ) {
    buyer.role = "verified_buyer";
    buyer.requiredMaterialCategories = ["Plastic Waste"];
    buyer.materialTypes = ["Plastic Waste"];
    buyer.state = buyer.state || "Tamil Nadu";
    buyer.stateCode = buyer.stateCode || "TN";
    buyer.location = buyer.location || "Coimbatore";
    buyer.country = buyer.country || "IN";
    buyer.emailVerified = true;
    await buyer.save();
    console.log("Updated buyer profile for match test");
  }

  section("Publish material and check 75%+ match");
  const material = await Material.create({
    title: `Notify test lot ${RUN_ID}`,
    materialType: "Plastic Waste",
    description: "Notification email test listing",
    quantity: 10,
    unit: "MT",
    location: "Chennai, Tamil Nadu",
    availabilityFrequency: "one_time",
    status: "available",
    visibility: "network",
    provider: provider._id,
    pickupAvailable: false,
    country: "IN",
    marketScope: "india",
  });
  ids.materials.push(material._id);

  const populatedMaterial = await Material.findById(material._id).populate(
    "provider",
    "companyName preferredMaterialCategories materialTypes state location country"
  );

  const match = scoreMaterialForBuyer(
    populatedMaterial,
    buyer.toObject(),
    provider.toObject()
  );
  console.log("Match score:", match.total, "-", match.matchLabel);
  if (match.total < 75) {
    throw new Error(`Expected score >= 75 for email test, got ${match.total}`);
  }

  await notifyBuyersOfNewMaterial(populatedMaterial);
  const matchNotif = await Notification.findOne({
    recipient: buyer._id,
    type: "new_matching_material",
    relatedMaterial: material._id,
  });
  if (!matchNotif) {
    throw new Error("new_matching_material in-app notification was not created");
  }
  ids.notifications.push(matchNotif._id);
  if (overrideEmail) ids.cleanupNotificationIds.push(matchNotif._id);
  console.log("OK in-app match notification created:", matchNotif._id.toString());

  section("Send interest alert email to provider");
  const interestCopy = interestReceived({
    buyerCompany: buyer.companyName,
    materialTitle: material.title,
  });
  const interestNotif = await createNotification({
    recipient: provider._id,
    type: "interest_received",
    title: interestCopy.title,
    message: interestCopy.message,
    relatedMaterial: material._id,
    relatedInterest: null,
  });
  ids.notifications.push(interestNotif._id);
  if (overrideEmail) ids.cleanupNotificationIds.push(interestNotif._id);
  console.log("OK in-app interest notification created:", interestNotif._id.toString());

  section("Waiting for async email delivery");
  await sleep(3500);

  console.log("\nDone.");
  if (isEmailConfigured(env)) {
    console.log(`Check inbox: ${buyer.email} (match email)`);
    console.log(`Provider test email is ${provider.email} (likely undeliverable @test.local)`);
  } else if (env.NODE_ENV !== "production") {
    console.log("SMTP not set — check backend terminal for [email:dev] log lines.");
  }

  await cleanup(ids);
}

main()
  .then(async () => {
    await disconnectSeedDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\nFAILED:", err.message);
    await disconnectSeedDatabase();
    process.exit(1);
  });
