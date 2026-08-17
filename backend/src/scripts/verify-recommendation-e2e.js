/**
 * E2E verification: onboarding profile fields → material publish → recommendations → interest.
 * Usage: node src/scripts/verify-recommendation-e2e.js
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { connectSeedDatabase, disconnectSeedDatabase } = require("./utils/db");
const { User } = require("../modules/users/user.model");
const { Material } = require("../modules/materials/material.model");
const { Interest } = require("../modules/interests/interest.model");
const { Notification } = require("../modules/notifications/notification.model");
const {
  getMaterialRecommendations,
  getParticipantRecommendations,
} = require("../modules/recommendations/recommendation.service");
const {
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
  notifyBuyersOfNewMaterial,
} = require("../modules/matches/match.service");
const { scoreMaterialForBuyer } = require("../modules/matches/mvp-match.service");
const { getRankedBuyerFeedItems } = require("../modules/recommendations/recommendation.service");

const RUN_ID = Date.now().toString(36);
const PASSWORD = "E2eTest123!";

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

async function cleanup(ids) {
  const { users, materials, interests } = ids;
  if (interests?.length) {
    await Interest.deleteMany({ _id: { $in: interests } });
  }
  if (materials?.length) {
    await Notification.deleteMany({ relatedMaterial: { $in: materials } });
    await Material.deleteMany({ _id: { $in: materials } });
  }
  if (users?.length) {
    await Notification.deleteMany({ recipient: { $in: users } });
    await User.deleteMany({ _id: { $in: users } });
  }
}

async function main() {
  const ids = { users: [], materials: [], interests: [] };
  await connectSeedDatabase();

  try {
    section("1. Simulate onboarding profiles (provider + buyer)");
    const hash = await bcrypt.hash(PASSWORD, 12);

    const provider = await User.create({
      name: "E2E Provider",
      companyName: `E2E Provider Co ${RUN_ID}`,
      email: `e2e-provider-${RUN_ID}@test.local`,
      password: hash,
      role: "material_provider",
      preferredMaterialCategories: ["Plastic Waste"],
      materialTypes: ["Plastic Waste"],
      state: "Tamil Nadu",
      stateCode: "TN",
      location: "Chennai",
      operationalLocation: "Tamil Nadu · Chennai",
    });
    ids.users.push(provider._id);

    const buyer = await User.create({
      name: "E2E Buyer",
      companyName: `E2E Buyer Co ${RUN_ID}`,
      email: `e2e-buyer-${RUN_ID}@test.local`,
      password: hash,
      role: "verified_buyer",
      requiredMaterialCategories: ["Plastic Waste"],
      materialTypes: ["Plastic Waste"],
      state: "Tamil Nadu",
      stateCode: "TN",
      location: "Coimbatore",
      operationalLocation: "Tamil Nadu · Coimbatore",
    });
    ids.users.push(buyer._id);

    assert(
      provider.preferredMaterialCategories.includes("Plastic Waste"),
      "provider categories saved"
    );
    assert(
      buyer.requiredMaterialCategories.includes("Plastic Waste"),
      "buyer categories saved"
    );
    assert(provider.state === "Tamil Nadu" && provider.location === "Chennai", "provider location");
    assert(buyer.state === "Tamil Nadu" && buyer.location === "Coimbatore", "buyer location");
    console.log("OK profiles created");

    section("2. Provider publishes material (canonical category + city, state)");
    const material = await Material.create({
      title: `E2E Plastic lot ${RUN_ID}`,
      materialType: "Plastic Waste",
      description: "E2E test listing",
      quantity: 10,
      unit: "MT",
      location: "Chennai, Tamil Nadu",
      availabilityFrequency: "one_time",
      status: "available",
      visibility: "network",
      provider: provider._id,
      pickupAvailable: false,
    });
    ids.materials.push(material._id);

    const populatedMaterial = await Material.findById(material._id).populate(
      "provider",
      "companyName preferredMaterialCategories materialTypes state location"
    );

    section("3. MVP match score (buyer ↔ material)");
    const match = scoreMaterialForBuyer(populatedMaterial, buyer.toObject(), provider.toObject());
    console.log("Score:", match.total, match.matchLabel);
    assert(match.materialScore === 70, "category score 70");
    assert(match.locationScore === 15, "same state different city = 15");
    assert(match.total === 85, "total score 85 Strong Match");
    assert(match.matchLabel === "Strong Match", "match label");

    section("4. Buyer material recommendations");
    const buyerRecs = await getMaterialRecommendations({
      id: buyer._id.toString(),
      role: "verified_buyer",
    });
    const nearSection = buyerRecs.sections.find((s) => s.id === "materials_near_you");
    assert(nearSection, "materials_near_you section exists");
    assert(
      nearSection.items.some((i) => i.materialId === material._id.toString()),
      "listing appears in Materials Near You"
    );
    console.log(`OK ${nearSection.items.length} near-you items`);

    section("5. Buyer match suggestions + opportunity feed ranking");
    const suggestions = await getBuyerMaterialSuggestions(buyer._id.toString());
    assert(
      suggestions.items.some((i) => i.materialId === material._id.toString()),
      "suggestions include material"
    );
    const feed = await getRankedBuyerFeedItems(buyer._id.toString());
    assert(feed.length > 0, "ranked feed not empty");
    console.log(`OK suggestions=${suggestions.items.length} feed=${feed.length}`);

    section("6. Provider buyer recommendations");
    const providerRecs = await getParticipantRecommendations({
      id: provider._id.toString(),
      role: "material_provider",
    });
    const buyersNear = providerRecs.sections.find((s) => s.id === "buyers_near_you");
    assert(buyersNear, "buyers_near_you section exists");
    assert(
      buyersNear.items.some((i) => i.participantId === buyer._id.toString()),
      "buyer in provider recommendations"
    );
    const signals = await getProviderMatchSignals(provider._id.toString());
    assert(
      signals.buyers.some((b) => b.buyerId === buyer._id.toString()),
      "provider match signals include buyer"
    );
    console.log(`OK provider sees ${buyersNear.items.length} nearby buyers`);

    section("7. Notification on publish (score >= 75)");
    await Notification.deleteMany({ relatedMaterial: material._id });
    await notifyBuyersOfNewMaterial(populatedMaterial);
    const notif = await Notification.findOne({
      recipient: buyer._id,
      type: "new_matching_material",
      relatedMaterial: material._id,
    });
    assert(notif, "buyer received new_matching_material notification");
    console.log("OK notification sent");

    section("8. Buyer expresses interest (connect)");
    const interest = await Interest.create({
      buyer: buyer._id,
      provider: provider._id,
      material: material._id,
      status: "pending",
      message: "E2E interest — interested in this lot.",
    });
    ids.interests.push(interest._id);
    const saved = await Interest.findById(interest._id).lean();
    assert(saved?.status === "pending", "interest created");
    console.log("OK interest created:", interest._id.toString());

    section("9. Cross-state discovery");
    const buyerKarnataka = await User.create({
      name: "E2E Buyer KA",
      companyName: `E2E Buyer KA ${RUN_ID}`,
      email: `e2e-buyer-ka-${RUN_ID}@test.local`,
      password: hash,
      role: "verified_buyer",
      requiredMaterialCategories: ["Plastic Waste"],
      materialTypes: ["Plastic Waste"],
      state: "Karnataka",
      stateCode: "KA",
      location: "Bengaluru",
    });
    ids.users.push(buyerKarnataka._id);

    const kaMatch = scoreMaterialForBuyer(
      populatedMaterial,
      buyerKarnataka.toObject(),
      provider.toObject()
    );
    assert(kaMatch.total === 70, "cross-state category match = 70");
    const kaRecs = await getMaterialRecommendations({
      id: buyerKarnataka._id.toString(),
      role: "verified_buyer",
    });
    const otherSection = kaRecs.sections.find((s) => s.id === "materials_other_states");
    assert(otherSection, "materials_other_states section");
    assert(
      otherSection.items.some((i) => i.materialId === material._id.toString()),
      "TN listing in other states for KA buyer"
    );
    console.log("OK cross-state section works");

    console.log("\n✅ All recommendation E2E checks passed.\n");
  } finally {
    section("Cleanup");
    await cleanup(ids);
    await disconnectSeedDatabase();
    console.log("Done.");
  }
}

main().catch((err) => {
  console.error("\n❌ E2E failed:", err.message);
  process.exit(1);
});
