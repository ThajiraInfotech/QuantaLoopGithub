const mongoose = require("mongoose");

const { Conversation } = require("../conversations/conversation.model");
const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");
const {
  mapMaterialStatusForPublic,
} = require("../materials/material-status.helper");
const { Message } = require("../messages/message.model");
const { Report } = require("../reports/report.model");
const { User, toPublicJSON } = require("../users/user.model");
const MS_48H = 48 * 60 * 60 * 1000;
const MS_7D = 7 * 24 * 60 * 60 * 1000;

const PARTICIPANT_FILTER = { role: { $ne: "admin" } };

function weekAgo() {
  return new Date(Date.now() - MS_7D);
}

function hours48Ago() {
  return new Date(Date.now() - MS_48H);
}

function days7Ago() {
  return new Date(Date.now() - MS_7D);
}

function monthRangeBounds() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { thisMonthStart, lastMonthStart };
}

function growthPercent(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

async function countInactiveDiscussions() {
  const activeInterestIds = await Interest.find({
    status: { $in: ["discussion", "pickup_scheduled"] },
  })
    .select("_id")
    .lean();

  if (activeInterestIds.length === 0) return 0;

  const ids = activeInterestIds.map((i) => i._id);
  const cutoff = days7Ago();

  return Conversation.countDocuments({
    interest: { $in: ids },
    status: "active",
    $or: [
      { lastMessageAt: { $lte: cutoff } },
      { lastMessageAt: null, updatedAt: { $lte: cutoff } },
    ],
  });
}

async function listInactiveDiscussionsPreview(limit = 5) {
  const activeInterestIds = await Interest.find({
    status: { $in: ["discussion", "pickup_scheduled"] },
  })
    .select("_id")
    .lean();

  if (activeInterestIds.length === 0) return [];

  const ids = activeInterestIds.map((i) => i._id);
  const cutoff = days7Ago();

  const rows = await Conversation.find({
    interest: { $in: ids },
    status: "active",
    $or: [
      { lastMessageAt: { $lte: cutoff } },
      { lastMessageAt: null, updatedAt: { $lte: cutoff } },
    ],
  })
    .populate("material", "title")
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean();

  return rows.map((c) => ({
    id: c._id.toString(),
    materialTitle:
      c.material && typeof c.material === "object" ? c.material.title ?? "" : "",
    lastMessageAt: c.lastMessageAt,
    updatedAt: c.updatedAt,
  }));
}

function mapReportPreview(doc, userMap, materialMap) {
  const targetUserId = doc.targetUser?.toString?.() ?? null;
  const targetMaterialId = doc.targetMaterial?.toString?.() ?? null;
  const targetLabel =
    doc.targetType === "participant"
      ? userMap.get(targetUserId)?.companyName ?? "Unknown participant"
      : materialMap.get(targetMaterialId)?.title ?? "Unknown material";

  return {
    id: doc._id.toString(),
    targetType: doc.targetType,
    targetUserId,
    targetMaterialId,
    targetLabel,
    reason: doc.reason,
    details: doc.details ?? "",
    createdAt: doc.createdAt,
  };
}

async function enrichOpenReports(limit = 5) {
  const docs = await Report.find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const userIds = docs
    .filter((d) => d.targetType === "participant" && d.targetUser)
    .map((d) => d.targetUser);
  const materialIds = docs
    .filter((d) => d.targetType === "material" && d.targetMaterial)
    .map((d) => d.targetMaterial);

  const [users, materials] = await Promise.all([
    userIds.length
      ? User.find({ _id: { $in: userIds } })
          .select("companyName")
          .lean()
      : [],
    materialIds.length
      ? Material.find({ _id: { $in: materialIds } })
          .select("title")
          .lean()
      : [],
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const materialMap = new Map(materials.map((m) => [m._id.toString(), m]));

  return docs.map((d) => mapReportPreview(d, userMap, materialMap));
}

async function getParticipantSummary() {
  const [total, providers, buyers, suspended] = await Promise.all([
    User.countDocuments(PARTICIPANT_FILTER),
    User.countDocuments({ ...PARTICIPANT_FILTER, role: "material_provider" }),
    User.countDocuments({ ...PARTICIPANT_FILTER, role: "verified_buyer" }),
    User.countDocuments({ ...PARTICIPANT_FILTER, accountStatus: "suspended" }),
  ]);

  return { total, providers, buyers, suspended };
}

async function getDashboardStats() {
  const weekStart = weekAgo();
  const stale48h = hours48Ago();
  const { thisMonthStart, lastMonthStart } = monthRangeBounds();

  const [
    participants,
    materials,
    activeDeals,
    completedDeals,
    participantsThisMonth,
    participantsLastMonth,
    materialsThisMonth,
    materialsLastMonth,
    openReports,
    interestsWaiting48h,
    inactiveDiscussions7d,
    recentlySuspended,
    newParticipantsThisWeek,
    newMaterialsThisWeek,
    interestsCreatedThisWeek,
    dealsCompletedThisWeek,
    funnelInterestCreated,
    funnelDiscussion,
    funnelPickup,
    funnelCompleted,
    recentParticipantsPreview,
    openReportsPreview,
    inactivePreview,
  ] = await Promise.all([
    User.countDocuments(PARTICIPANT_FILTER),
    Material.countDocuments({}),
    Interest.countDocuments({
      status: { $in: ["discussion", "pickup_scheduled"] },
    }),
    Interest.countDocuments({ status: "completed" }),
    User.countDocuments({
      ...PARTICIPANT_FILTER,
      createdAt: { $gte: thisMonthStart },
    }),
    User.countDocuments({
      ...PARTICIPANT_FILTER,
      createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
    }),
    Material.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Material.countDocuments({
      createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
    }),
    Report.countDocuments({ status: "open" }),
    Interest.countDocuments({
      status: "pending",
      createdAt: { $lte: stale48h },
    }),
    countInactiveDiscussions(),
    User.countDocuments({ ...PARTICIPANT_FILTER, accountStatus: "suspended" }),
    User.countDocuments({ ...PARTICIPANT_FILTER, createdAt: { $gte: weekStart } }),
    Material.countDocuments({ createdAt: { $gte: weekStart } }),
    Interest.countDocuments({ createdAt: { $gte: weekStart } }),
    Interest.countDocuments({
      status: "completed",
      updatedAt: { $gte: weekStart },
    }),
    Interest.countDocuments({}),
    Interest.countDocuments({
      status: { $in: ["discussion", "pickup_scheduled", "completed"] },
    }),
    Interest.countDocuments({
      status: { $in: ["pickup_scheduled", "completed"] },
    }),
    Interest.countDocuments({ status: "completed" }),
    User.find(PARTICIPANT_FILTER)
      .select("name companyName email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    enrichOpenReports(5),
    listInactiveDiscussionsPreview(5),
  ]);

  return {
    kpis: {
      participants,
      materials,
      activeDeals,
      completedDeals,
      participantsGrowthPct: growthPercent(
        participantsThisMonth,
        participantsLastMonth
      ),
      materialsGrowthPct: growthPercent(materialsThisMonth, materialsLastMonth),
    },
    actionRequired: {
      openReports,
      interestsWaiting48h,
      inactiveDiscussions7d,
      recentlySuspended,
    },
    platformActivity: {
      newParticipantsThisWeek,
      newMaterialsPublished: newMaterialsThisWeek,
      interestsCreated: interestsCreatedThisWeek,
      dealsCompleted: dealsCompletedThisWeek,
    },
    dealFunnel: {
      interestCreated: funnelInterestCreated,
      discussionStarted: funnelDiscussion,
      pickupScheduled: funnelPickup,
      completed: funnelCompleted,
    },
    recentParticipants: recentParticipantsPreview.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      companyName: u.companyName,
      role: u.role,
      createdAt: u.createdAt,
    })),
    recentIssues: {
      openReports: openReportsPreview,
      inactiveDiscussions: inactivePreview,
    },
  };
}

function mergeActivityRows(map, rows) {
  for (const row of rows) {
    const id = row._id.toString();
    const candidate = row.lastAt;
    if (!candidate) continue;
    const existing = map.get(id);
    if (!existing || new Date(candidate) > new Date(existing)) {
      map.set(id, candidate);
    }
  }
}

async function getLastActivityMap(userIds) {
  const map = new Map();
  if (!userIds.length) return map;

  const oidIds = userIds.map((id) => new mongoose.Types.ObjectId(id));

  const [messageRows, interestRows, conversationRows, users] = await Promise.all([
    Message.aggregate([
      { $match: { sender: { $in: oidIds } } },
      { $group: { _id: "$sender", lastAt: { $max: "$createdAt" } } },
    ]),
    Interest.aggregate([
      {
        $match: {
          $or: [{ buyer: { $in: oidIds } }, { provider: { $in: oidIds } }],
        },
      },
      {
        $project: {
          updatedAt: 1,
          participants: ["$buyer", "$provider"],
        },
      },
      { $unwind: "$participants" },
      { $match: { participants: { $in: oidIds } } },
      { $group: { _id: "$participants", lastAt: { $max: "$updatedAt" } } },
    ]),
    Conversation.aggregate([
      {
        $match: {
          $or: [{ buyer: { $in: oidIds } }, { provider: { $in: oidIds } }],
        },
      },
      {
        $project: {
          participants: ["$buyer", "$provider"],
          lastAt: { $max: ["$lastMessageAt", "$updatedAt"] },
        },
      },
      { $unwind: "$participants" },
      { $match: { participants: { $in: oidIds } } },
      { $group: { _id: "$participants", lastAt: { $max: "$lastAt" } } },
    ]),
    User.find({ _id: { $in: oidIds } })
      .select("updatedAt")
      .lean(),
  ]);

  mergeActivityRows(map, messageRows);
  mergeActivityRows(map, interestRows);
  mergeActivityRows(map, conversationRows);

  for (const user of users) {
    const id = user._id.toString();
    const existing = map.get(id);
    const candidate = user.updatedAt;
    if (!candidate) continue;
    if (!existing || new Date(candidate) > new Date(existing)) {
      map.set(id, candidate);
    }
  }

  return map;
}

async function listParticipants({
  search = "",
  role,
  accountStatus,
  page = 1,
  limit = 20,
}) {
  const filter = { ...PARTICIPANT_FILTER };
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

  if (role && role !== "all") {
    filter.role = role;
  }
  if (accountStatus && accountStatus !== "all") {
    filter.accountStatus = accountStatus;
  }
  if (search.trim()) {
    const term = search.trim();
    filter.$or = [
      { companyName: { $regex: term, $options: "i" } },
      { name: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [items, total, summary] = await Promise.all([
    User.find(filter)
      .select("name companyName email role accountStatus createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(filter),
    getParticipantSummary(),
  ]);

  const activityMap = await getLastActivityMap(
    items.map((u) => u._id.toString())
  );

  return {
    items: items.map((u) => {
      const id = u._id.toString();
      const lastActivityAt =
        activityMap.get(id) ?? u.updatedAt ?? u.createdAt;

      return {
        id,
        name: u.name,
        companyName: u.companyName,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus ?? "active",
        createdAt: u.createdAt,
        lastActivityAt,
      };
    }),
    total,
    page: safePage,
    limit: safeLimit,
    summary,
  };
}

async function buildRecentActivity(uid) {
  const userId = uid.toString();
  const events = [];

  const [
    materials,
    interestsAsBuyer,
    interestsAsProvider,
    messages,
    userDoc,
  ] = await Promise.all([
    Material.find({ provider: uid })
      .select("title createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Interest.find({ buyer: uid })
      .select("createdAt material")
      .populate("material", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Interest.find({ provider: uid })
      .select("createdAt material buyer")
      .populate("material", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Message.find({ sender: uid, isSystem: { $ne: true } })
      .select("createdAt conversation")
      .populate({
        path: "conversation",
        select: "material",
        populate: { path: "material", select: "title" },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.findById(uid).select("lastLoginAt").lean(),
  ]);

  for (const m of materials) {
    events.push({
      type: "material_created",
      description: `Created material ${m.title}`,
      occurredAt: m.createdAt,
      relatedId: m._id.toString(),
      relatedType: "material",
    });
  }

  for (const i of interestsAsBuyer) {
    const title = i.material?.title ?? "material";
    events.push({
      type: "interest_created",
      description: `Created interest on ${title}`,
      occurredAt: i.createdAt,
      relatedId: i._id.toString(),
      relatedType: "interest",
    });
  }

  for (const i of interestsAsProvider) {
    const title = i.material?.title ?? "material";
    events.push({
      type: "interest_received",
      description: `Received interest on ${title}`,
      occurredAt: i.createdAt,
      relatedId: i._id.toString(),
      relatedType: "interest",
    });
  }

  for (const msg of messages) {
    const title = msg.conversation?.material?.title ?? "discussion";
    events.push({
      type: "message_sent",
      description: `Sent message in ${title}`,
      occurredAt: msg.createdAt,
      relatedId: msg.conversation?._id?.toString() ?? null,
      relatedType: "conversation",
    });
  }

  if (userDoc?.lastLoginAt) {
    events.push({
      type: "logged_in",
      description: "Logged in",
      occurredAt: userDoc.lastLoginAt,
      relatedId: userId,
      relatedType: "user",
    });
  }

  return events
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 12);
}

async function getParticipantDetail(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user || user.role === "admin") {
    return null;
  }

  const uid = user._id;
  const participantFilter = { $or: [{ buyer: uid }, { provider: uid }] };

  const [
    materialsPublished,
    interestsCreated,
    interestsReceived,
    activeDiscussions,
    completedDeals,
    totalDiscussions,
    latestInterest,
    latestConversation,
    activityMap,
    recentActivity,
  ] = await Promise.all([
    Material.countDocuments({ provider: uid }),
    Interest.countDocuments({ buyer: uid }),
    Interest.countDocuments({ provider: uid }),
    Conversation.countDocuments({
      status: "active",
      ...participantFilter,
    }),
    Interest.countDocuments({
      ...participantFilter,
      status: "completed",
    }),
    Conversation.countDocuments(participantFilter),
    Interest.findOne(participantFilter)
      .sort({ updatedAt: -1 })
      .select("_id")
      .lean(),
    Conversation.findOne(participantFilter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .select("_id")
      .lean(),
    getLastActivityMap([userId]),
    buildRecentActivity(uid),
  ]);

  const lastActivityAt =
    activityMap.get(userId) ?? user.updatedAt ?? user.createdAt;

  const profile = {
    ...toPublicJSON(user, { includeEmail: true }),
    phone: user.phone ?? "",
    jobTitle: user.jobTitle ?? "",
  };

  return {
    profile,
    accountHealth: {
      lastActivityAt,
      lastLoginAt: user.lastLoginAt ?? null,
      loginCount: user.loginCount ?? 0,
    },
    activity: {
      materialsPublished,
      interestsCreated,
      interestsReceived,
      activeDiscussions,
      completedDeals,
      totalDiscussions,
    },
    recentActivity,
    navigation: {
      latestInterestId: latestInterest?._id?.toString() ?? null,
      latestConversationId: latestConversation?._id?.toString() ?? null,
    },
  };
}

async function patchParticipantAccount(userId, accountStatus) {
  const user = await User.findById(userId);
  if (!user || user.role === "admin") {
    return null;
  }
  user.accountStatus = accountStatus;
  await user.save();
  return toPublicJSON(user, { includeEmail: true });
}

async function listEnrichedReports(statusFilter = "open") {
  const result = await listAdminReports({
    status:
      statusFilter === "resolved"
        ? "resolved"
        : statusFilter === "all"
          ? "all"
          : "open",
    limit: 100,
    page: 1,
  });
  return result.items;
}

function formatReportRefId(id) {
  return `RPT-${id.toString().slice(-8).toUpperCase()}`;
}

async function getAdminReportSummary() {
  const [total, open, resolved, material, participant] = await Promise.all([
    Report.countDocuments(),
    Report.countDocuments({ status: "open" }),
    Report.countDocuments({ status: "resolved" }),
    Report.countDocuments({ targetType: "material" }),
    Report.countDocuments({ targetType: "participant" }),
  ]);

  return { total, open, resolved, material, participant };
}

async function getInterestReportScope(interestId) {
  if (!interestId || !mongoose.Types.ObjectId.isValid(interestId)) {
    return null;
  }
  const doc = await Interest.findById(interestId)
    .select("material buyer provider")
    .lean();
  if (!doc) return null;
  return {
    materialId: doc.material?.toString() ?? null,
    buyerId: doc.buyer?.toString() ?? null,
    providerId: doc.provider?.toString() ?? null,
  };
}

async function buildReportMatchFilter({
  search = "",
  status,
  targetType,
  reason,
  reporter,
  participant,
  material,
  interest,
  dateFrom,
  dateTo,
}) {
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }
  if (targetType && targetType !== "all") {
    filter.targetType = targetType;
  }
  if (reason && reason !== "all") {
    filter.reason = reason;
  }
  if (reporter && mongoose.Types.ObjectId.isValid(reporter)) {
    filter.reporter = new mongoose.Types.ObjectId(reporter);
  }

  const interestScope = interest ? await getInterestReportScope(interest) : null;

  if (interestScope) {
    const or = [];
    if (interestScope.materialId) {
      or.push({
        targetType: "material",
        targetMaterial: new mongoose.Types.ObjectId(interestScope.materialId),
      });
    }
    if (interestScope.buyerId) {
      or.push({
        targetType: "participant",
        targetUser: new mongoose.Types.ObjectId(interestScope.buyerId),
      });
    }
    if (interestScope.providerId) {
      or.push({
        targetType: "participant",
        targetUser: new mongoose.Types.ObjectId(interestScope.providerId),
      });
    }
    if (or.length) {
      filter.$or = or;
    } else {
      filter._id = { $in: [] };
    }
  } else {
    if (participant && mongoose.Types.ObjectId.isValid(participant)) {
      filter.targetType = "participant";
      filter.targetUser = new mongoose.Types.ObjectId(participant);
    }
    if (material && mongoose.Types.ObjectId.isValid(material)) {
      filter.targetType = "material";
      filter.targetMaterial = new mongoose.Types.ObjectId(material);
    }
  }

  if (dateFrom?.trim()) {
    const from = new Date(dateFrom.trim());
    if (!Number.isNaN(from.getTime())) {
      filter.createdAt = { ...(filter.createdAt ?? {}), $gte: from };
    }
  }
  if (dateTo?.trim()) {
    const to = new Date(dateTo.trim());
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filter.createdAt = { ...(filter.createdAt ?? {}), $lte: to };
    }
  }

  if (search.trim()) {
    const term = search.trim();
    const [targetUsers, reporters, materials] = await Promise.all([
      User.find({ companyName: { $regex: term, $options: "i" } }).distinct("_id"),
      User.find({ companyName: { $regex: term, $options: "i" } }).distinct("_id"),
      Material.find({ title: { $regex: term, $options: "i" } }).distinct("_id"),
    ]);

    const or = [];
    if (mongoose.Types.ObjectId.isValid(term)) {
      or.push({ _id: new mongoose.Types.ObjectId(term) });
    }
    const suffix = term.replace(/^RPT-/i, "").toUpperCase();
    if (/^[A-F0-9]{6,8}$/.test(suffix)) {
      const candidates = await Report.find().select("_id").lean();
      const matched = candidates
        .filter((r) => r._id.toString().toUpperCase().endsWith(suffix.slice(-8)))
        .map((r) => r._id);
      if (matched.length) or.push({ _id: { $in: matched } });
    }
    if (targetUsers.length) {
      or.push({ targetUser: { $in: targetUsers } });
    }
    if (materials.length) {
      or.push({ targetMaterial: { $in: materials } });
    }
    if (reporters.length) {
      or.push({ reporter: { $in: reporters } });
    }

    if (or.length) {
      filter.$and = filter.$and ?? [];
      filter.$and.push({ $or: or });
    }
  }

  return filter;
}

function mapAdminReportRow(doc, reporter, targetUser, targetMaterial, resolver) {
  const id = doc._id.toString();
  const targetUserId = doc.targetUser?.toString?.() ?? null;
  const targetMaterialId = doc.targetMaterial?.toString?.() ?? null;
  const targetLabel =
    doc.targetType === "participant"
      ? targetUser?.companyName ?? "Unknown participant"
      : targetMaterial?.title ?? "Unknown material";

  return {
    id,
    reportRefId: formatReportRefId(id),
    targetType: doc.targetType,
    targetUserId,
    targetMaterialId,
    targetLabel,
    reporterId: doc.reporter?.toString?.() ?? "",
    reporterName: reporter?.name ?? "",
    reporterCompany: reporter?.companyName ?? "Unknown reporter",
    reason: doc.reason,
    details: doc.details ?? "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    resolvedAt: doc.resolvedAt ?? null,
    resolvedById: doc.resolvedBy?.toString?.() ?? null,
    resolvedByName: resolver?.name ?? null,
  };
}

async function enrichReportRows(docs) {
  if (!docs.length) return [];

  const reporterIds = [...new Set(docs.map((d) => d.reporter?.toString()).filter(Boolean))];
  const targetUserIds = [
    ...new Set(
      docs
        .filter((d) => d.targetType === "participant" && d.targetUser)
        .map((d) => d.targetUser.toString())
    ),
  ];
  const targetMaterialIds = [
    ...new Set(
      docs
        .filter((d) => d.targetType === "material" && d.targetMaterial)
        .map((d) => d.targetMaterial.toString())
    ),
  ];
  const resolverIds = [
    ...new Set(docs.map((d) => d.resolvedBy?.toString()).filter(Boolean)),
  ];

  const [reporters, targetUsers, targetMaterials, resolvers] = await Promise.all([
    reporterIds.length
      ? User.find({ _id: { $in: reporterIds } })
          .select("name companyName role")
          .lean()
      : [],
    targetUserIds.length
      ? User.find({ _id: { $in: targetUserIds } })
          .select("companyName name role accountStatus")
          .lean()
      : [],
    targetMaterialIds.length
      ? Material.find({ _id: { $in: targetMaterialIds } })
          .select("title materialType status provider")
          .lean()
      : [],
    resolverIds.length
      ? User.find({ _id: { $in: resolverIds } }).select("name companyName").lean()
      : [],
  ]);

  const reporterMap = new Map(reporters.map((u) => [u._id.toString(), u]));
  const targetUserMap = new Map(targetUsers.map((u) => [u._id.toString(), u]));
  const targetMaterialMap = new Map(targetMaterials.map((m) => [m._id.toString(), m]));
  const resolverMap = new Map(resolvers.map((u) => [u._id.toString(), u]));

  return docs.map((doc) =>
    mapAdminReportRow(
      doc,
      reporterMap.get(doc.reporter?.toString() ?? ""),
      targetUserMap.get(doc.targetUser?.toString() ?? ""),
      targetMaterialMap.get(doc.targetMaterial?.toString() ?? ""),
      resolverMap.get(doc.resolvedBy?.toString() ?? "")
    )
  );
}

async function getReportReporterOptions() {
  const reporterIds = await Report.distinct("reporter");
  if (!reporterIds.length) return [];

  const users = await User.find({ _id: { $in: reporterIds } })
    .select("name companyName")
    .lean();

  return users
    .map((u) => ({
      id: u._id.toString(),
      name: u.name ?? "",
      companyName: u.companyName ?? "",
    }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
}

async function listAdminReports({
  search = "",
  status = "open",
  targetType = "all",
  reason = "all",
  reporter,
  participant,
  material,
  interest,
  dateFrom = "",
  dateTo = "",
  sort = "newest",
  page = 1,
  limit = 20,
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const match = await buildReportMatchFilter({
    search,
    status,
    targetType,
    reason,
    reporter,
    participant,
    material,
    interest,
    dateFrom,
    dateTo,
  });

  const [summary, total, reporters] = await Promise.all([
    getAdminReportSummary(),
    Report.countDocuments(match),
    getReportReporterOptions(),
  ]);

  const sortOpt = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const docs = await Report.find(match)
    .sort(sortOpt)
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const items = await enrichReportRows(docs);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    summary,
    reporters,
  };
}

async function getAdminReportDetail(reportId) {
  const doc = await Report.findById(reportId).lean();
  if (!doc) return null;

  const [reporter, targetUser, targetMaterial, resolver] = await Promise.all([
    User.findById(doc.reporter)
      .select("name companyName email role accountStatus createdAt")
      .lean(),
    doc.targetType === "participant" && doc.targetUser
      ? User.findById(doc.targetUser)
          .select("name companyName email role accountStatus createdAt")
          .lean()
      : null,
    doc.targetType === "material" && doc.targetMaterial
      ? Material.findById(doc.targetMaterial)
          .select("title materialType location status quantity unit provider")
          .lean()
      : null,
    doc.resolvedBy ? User.findById(doc.resolvedBy).select("name companyName").lean() : null,
  ]);

  let materialProvider = null;
  if (targetMaterial?.provider) {
    materialProvider = await User.findById(targetMaterial.provider)
      .select("name companyName role accountStatus")
      .lean();
  }

  const id = doc._id.toString();
  const row = mapAdminReportRow(doc, reporter, targetUser, targetMaterial, resolver);

  return {
    report: row,
    reporter: reporter
      ? {
          id: reporter._id.toString(),
          name: reporter.name,
          companyName: reporter.companyName,
          email: reporter.email,
          role: reporter.role,
          accountStatus: reporter.accountStatus ?? "active",
          createdAt: reporter.createdAt,
        }
      : null,
    target:
      doc.targetType === "participant" && targetUser
        ? {
            type: "participant",
            id: targetUser._id.toString(),
            name: targetUser.name,
            companyName: targetUser.companyName,
            email: targetUser.email,
            role: targetUser.role,
            accountStatus: targetUser.accountStatus ?? "active",
            createdAt: targetUser.createdAt,
          }
        : targetMaterial
          ? {
              type: "material",
              id: targetMaterial._id.toString(),
              lotId: formatLotId(targetMaterial._id),
              title: targetMaterial.title,
              materialType: targetMaterial.materialType,
              location: targetMaterial.location,
              status: mapMaterialStatusForPublic(targetMaterial.status),
              quantity: targetMaterial.quantity,
              unit: targetMaterial.unit,
              provider: materialProvider
                ? {
                    id: materialProvider._id.toString(),
                    name: materialProvider.name,
                    companyName: materialProvider.companyName,
                    role: materialProvider.role,
                    accountStatus: materialProvider.accountStatus ?? "active",
                  }
                : null,
            }
          : null,
    resolution: {
      status: doc.status,
      resolvedAt: doc.resolvedAt ?? null,
      resolvedById: doc.resolvedBy?.toString() ?? null,
      resolvedByName: resolver?.name ?? null,
      resolvedByCompany: resolver?.companyName ?? null,
    },
    history: [
      {
        type: "created",
        label: "Report submitted",
        occurredAt: doc.createdAt,
      },
      ...(doc.resolvedAt
        ? [
            {
              type: "resolved",
              label: `Resolved by ${resolver?.name ?? "Administrator"}`,
              occurredAt: doc.resolvedAt,
              actorName: resolver?.name ?? "Administrator",
            },
            {
              type: "status_changed",
              label: "Status changed",
              detail: "Open → Resolved",
              occurredAt: doc.resolvedAt,
            },
          ]
        : []),
    ],
  };
}

function formatLotId(id) {
  return `LOT-${id.toString().slice(-8).toUpperCase()}`;
}

function buildMaterialStatusFilter(status) {
  if (!status || status === "all") return {};
  if (status === "available") return { status: { $in: ["available", "active"] } };
  if (status === "completed") return { status: "fulfilled" };
  if (status === "archived") return { status: { $in: ["archived", "inactive"] } };
  return { status };
}

function mapAdminMaterialRow(doc, provider, interestCount, reportCount) {
  const id = doc._id.toString();
  return {
    id,
    lotId: formatLotId(id),
    title: doc.title,
    materialType: doc.materialType,
    quantity: doc.quantity,
    unit: doc.unit,
    location: doc.location,
    status: mapMaterialStatusForPublic(doc.status),
    visibility: doc.visibility,
    provider: provider
      ? {
          id: provider._id.toString(),
          companyName: provider.companyName ?? "",
          name: provider.name ?? "",
          accountStatus: provider.accountStatus ?? "active",
        }
      : null,
    interestCount,
    reportCount,
    lastActivityAt: doc.updatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function buildMaterialMatchFilter({
  search = "",
  status,
  materialType,
  location,
  reportedOnly,
  participant,
}) {
  const filter = { ...buildMaterialStatusFilter(status) };

  if (participant && mongoose.Types.ObjectId.isValid(participant)) {
    filter.provider = new mongoose.Types.ObjectId(participant);
  }
  if (materialType && materialType !== "all") {
    filter.materialType = materialType;
  }
  if (location?.trim()) {
    filter.location = { $regex: location.trim(), $options: "i" };
  }
  if (reportedOnly) {
    const reportedIds = await Report.distinct("targetMaterial", {
      targetType: "material",
      status: "open",
      targetMaterial: { $ne: null },
    });
    filter._id = { $in: reportedIds.length ? reportedIds : [] };
  }
  if (search.trim()) {
    const term = search.trim();
    const providerIds = await User.find({
      companyName: { $regex: term, $options: "i" },
    }).distinct("_id");
    const or = [
      { title: { $regex: term, $options: "i" } },
      { materialType: { $regex: term, $options: "i" } },
    ];
    if (mongoose.Types.ObjectId.isValid(term)) {
      or.push({ _id: new mongoose.Types.ObjectId(term) });
    }
    if (providerIds.length) {
      or.push({ provider: { $in: providerIds } });
    }
    filter.$or = or;
  }

  return filter;
}

async function getAdminMaterialSummary() {
  const reportedIds = await Report.distinct("targetMaterial", {
    targetType: "material",
    status: "open",
    targetMaterial: { $ne: null },
  });

  const [total, available, inDiscussion, completed] = await Promise.all([
    Material.countDocuments(),
    Material.countDocuments({ status: { $in: ["available", "active"] } }),
    Material.countDocuments({ status: "in_discussion" }),
    Material.countDocuments({ status: "fulfilled" }),
  ]);

  return {
    total,
    available,
    inDiscussion,
    completed,
    reported: reportedIds.length,
  };
}

async function getMaterialCountMaps(materialIds) {
  if (!materialIds.length) {
    return { interests: new Map(), reports: new Map() };
  }

  const oidIds = materialIds.map((id) => new mongoose.Types.ObjectId(id));
  const [interestRows, reportRows] = await Promise.all([
    Interest.aggregate([
      { $match: { material: { $in: oidIds } } },
      { $group: { _id: "$material", count: { $sum: 1 } } },
    ]),
    Report.aggregate([
      {
        $match: {
          targetType: "material",
          status: "open",
          targetMaterial: { $in: oidIds },
        },
      },
      { $group: { _id: "$targetMaterial", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    interests: new Map(interestRows.map((r) => [r._id.toString(), r.count])),
    reports: new Map(reportRows.map((r) => [r._id.toString(), r.count])),
  };
}

async function listAdminMaterials({
  search = "",
  status,
  materialType,
  location,
  reportedOnly = false,
  participant,
  sort = "newest",
  page = 1,
  limit = 20,
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;
  const match = await buildMaterialMatchFilter({
    search,
    status,
    materialType,
    location,
    reportedOnly: reportedOnly === true || reportedOnly === "true",
    participant,
  });

  const [summary, total, materialTypes, providerOptions] = await Promise.all([
    getAdminMaterialSummary(),
    Material.countDocuments(match),
    Material.distinct("materialType"),
    getMaterialProvidersList(),
  ]);

  let docs;
  if (sort === "most_interests" || sort === "most_reports") {
    const oidPipeline = [
      { $match: match },
      {
        $lookup: {
          from: "interests",
          localField: "_id",
          foreignField: "material",
          as: "_interests",
        },
      },
      {
        $lookup: {
          from: "reports",
          let: { mid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$targetMaterial", "$$mid"] },
                    { $eq: ["$targetType", "material"] },
                    { $eq: ["$status", "open"] },
                  ],
                },
              },
            },
          ],
          as: "_reports",
        },
      },
      {
        $addFields: {
          interestCount: { $size: "$_interests" },
          reportCount: { $size: "$_reports" },
        },
      },
      {
        $sort:
          sort === "most_reports"
            ? { reportCount: -1, createdAt: -1 }
            : { interestCount: -1, createdAt: -1 },
      },
      { $skip: skip },
      { $limit: safeLimit },
    ];
    docs = await Material.aggregate(oidPipeline);
  } else {
    const sortOpt =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    docs = await Material.find(match)
      .sort(sortOpt)
      .skip(skip)
      .limit(safeLimit)
      .lean();
  }

  const materialIds = docs.map((d) => d._id.toString());
  const providerIds = [...new Set(docs.map((d) => d.provider?.toString?.()).filter(Boolean))];
  const [providerRows, countMaps] = await Promise.all([
    providerIds.length
      ? User.find({ _id: { $in: providerIds } })
          .select("companyName name accountStatus")
          .lean()
      : [],
    sort === "most_interests" || sort === "most_reports"
      ? { interests: new Map(), reports: new Map() }
      : getMaterialCountMaps(materialIds),
  ]);

  const providerMap = new Map(providerRows.map((p) => [p._id.toString(), p]));

  const items = docs.map((doc) => {
    const id = doc._id.toString();
    const interestCount =
      doc.interestCount ??
      countMaps.interests.get(id) ??
      0;
    const reportCount =
      doc.reportCount ??
      countMaps.reports.get(id) ??
      0;
    const provider = providerMap.get(doc.provider?.toString?.() ?? "");
    return mapAdminMaterialRow(doc, provider, interestCount, reportCount);
  });

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    summary,
    materialTypes: materialTypes.filter(Boolean).sort(),
    providers: providerOptions,
  };
}

async function getMaterialProvidersList() {
  const providerIds = await Material.distinct("provider");
  if (!providerIds.length) return [];

  return User.find({ _id: { $in: providerIds } })
    .select("companyName name accountStatus")
    .sort({ companyName: 1 })
    .lean()
    .then((rows) =>
      rows.map((p) => ({
        id: p._id.toString(),
        companyName: p.companyName ?? "",
        name: p.name ?? "",
        accountStatus: p.accountStatus ?? "active",
      }))
    );
}

async function getAdminMaterialDetail(materialId) {
  const doc = await Material.findById(materialId).lean();
  if (!doc) return null;

  const provider = await User.findById(doc.provider)
    .select(
      "companyName name email role accountStatus industryType location createdAt updatedAt"
    )
    .lean();
  if (!provider) return null;

  const mid = doc._id;
  const providerId = provider._id.toString();
  const [interestCount, discussionCount, openReports, reportHistory, latestInterest, providerActivityMap] =
    await Promise.all([
      Interest.countDocuments({ material: mid }),
      Conversation.countDocuments({ material: mid }),
      Report.find({
        targetType: "material",
        targetMaterial: mid,
        status: "open",
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Report.find({
        targetType: "material",
        targetMaterial: mid,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Interest.findOne({ material: mid }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
      getLastActivityMap([providerId]),
    ]);

  const reportCount = openReports.length;
  const lastActivityAt =
    latestInterest?.updatedAt && new Date(latestInterest.updatedAt) > new Date(doc.updatedAt)
      ? latestInterest.updatedAt
      : doc.updatedAt;
  const providerLastActivityAt =
    providerActivityMap.get(providerId) ?? provider.updatedAt ?? provider.createdAt;

  return {
    material: {
      id: doc._id.toString(),
      lotId: formatLotId(doc._id),
      title: doc.title,
      materialType: doc.materialType,
      description: doc.description,
      quantity: doc.quantity,
      unit: doc.unit,
      location: doc.location,
      availabilityFrequency: doc.availabilityFrequency,
      status: mapMaterialStatusForPublic(doc.status),
      visibility: doc.visibility,
      industryType: doc.industryType,
      pickupAvailable: doc.pickupAvailable,
      estimatedValueRange: doc.estimatedValueRange,
      imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    provider: {
      id: provider._id.toString(),
      companyName: provider.companyName,
      name: provider.name,
      email: provider.email,
      role: provider.role,
      accountStatus: provider.accountStatus ?? "active",
      industryType: provider.industryType ?? "",
      location: provider.location ?? "",
      createdAt: provider.createdAt,
      lastActivityAt: providerLastActivityAt,
    },
    activity: {
      interestCount,
      discussionCount,
      reportCount,
      lastActivityAt,
    },
    reports: openReports.map((r) => ({
      id: r._id.toString(),
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    })),
    reportHistory: reportHistory.map((r) => ({
      id: r._id.toString(),
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
    })),
  };
}

async function moderateAdminMaterial(materialId, action) {
  const doc = await Material.findById(materialId);
  if (!doc) return null;

  if (action === "archive") {
    doc.status = "archived";
  } else if (action === "restore") {
    doc.status = "available";
  } else {
    return null;
  }

  await doc.save();
  return doc._id.toString();
}

async function bulkModerateAdminMaterials(ids, action) {
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!validIds.length) return { updated: 0 };

  const status = action === "archive" ? "archived" : "available";
  const result = await Material.updateMany(
    { _id: { $in: validIds } },
    { $set: { status } }
  );

  return { updated: result.modifiedCount ?? 0 };
}

function formatInterestRefId(id) {
  return `INT-${id.toString().slice(-8).toUpperCase()}`;
}

function buildInterestStatusFilter(status) {
  if (!status || status === "all") return {};
  if (status === "pending") return { status: "pending" };
  if (status === "in_discussion") {
    return { status: { $in: ["discussion", "pickup_scheduled", "accepted"] } };
  }
  if (status === "completed") return { status: "completed" };
  return { status };
}

async function getReportedInterestIdSet() {
  const openReports = await Report.find({ status: "open" })
    .select("targetMaterial targetUser targetType")
    .lean();
  if (!openReports.length) return new Set();

  const materialIds = new Set();
  const userIds = new Set();
  for (const r of openReports) {
    if (r.targetType === "material" && r.targetMaterial) {
      materialIds.add(r.targetMaterial.toString());
    }
    if (r.targetType === "participant" && r.targetUser) {
      userIds.add(r.targetUser.toString());
    }
  }

  const or = [];
  if (materialIds.size) {
    or.push({
      material: {
        $in: [...materialIds].map((id) => new mongoose.Types.ObjectId(id)),
      },
    });
  }
  if (userIds.size) {
    const oids = [...userIds].map((id) => new mongoose.Types.ObjectId(id));
    or.push({ buyer: { $in: oids } }, { provider: { $in: oids } });
  }
  if (!or.length) return new Set();

  const ids = await Interest.find({ $or: or }).distinct("_id");
  return new Set(ids.map((id) => id.toString()));
}

async function countOpenReportsForInterestTargets(materialId, buyerId, providerId) {
  const [materialReports, buyerReports, providerReports] = await Promise.all([
    Report.countDocuments({
      status: "open",
      targetType: "material",
      targetMaterial: materialId,
    }),
    Report.countDocuments({
      status: "open",
      targetType: "participant",
      targetUser: buyerId,
    }),
    Report.countDocuments({
      status: "open",
      targetType: "participant",
      targetUser: providerId,
    }),
  ]);
  return materialReports + buyerReports + providerReports;
}

async function getReportsForInterestTargets(materialId, buyerId, providerId) {
  return Report.find({
    $or: [
      { targetType: "material", targetMaterial: materialId },
      { targetType: "participant", targetUser: buyerId },
      { targetType: "participant", targetUser: providerId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

async function buildInterestMatchFilter({
  search = "",
  status,
  participant,
  scope,
  material,
  buyer,
  provider,
  materialType,
  location,
  reportedOnly,
}) {
  const filter = { ...buildInterestStatusFilter(status) };

  if (participant && mongoose.Types.ObjectId.isValid(participant)) {
    const pid = new mongoose.Types.ObjectId(participant);
    if (scope === "created") {
      filter.buyer = pid;
    } else if (scope === "received") {
      filter.provider = pid;
    } else if (scope === "completed") {
      filter.$or = [{ buyer: pid }, { provider: pid }];
      filter.status = "completed";
    } else {
      filter.$or = [{ buyer: pid }, { provider: pid }];
    }
  }
  if (material && mongoose.Types.ObjectId.isValid(material)) {
    filter.material = new mongoose.Types.ObjectId(material);
  }
  if (buyer && mongoose.Types.ObjectId.isValid(buyer)) {
    filter.buyer = new mongoose.Types.ObjectId(buyer);
  }
  if (provider && mongoose.Types.ObjectId.isValid(provider)) {
    filter.provider = new mongoose.Types.ObjectId(provider);
  }

  if (
    (materialType && materialType !== "all") ||
    (location && location.trim())
  ) {
    const matFilter = {};
    if (materialType && materialType !== "all") {
      matFilter.materialType = materialType;
    }
    if (location?.trim()) {
      matFilter.location = { $regex: location.trim(), $options: "i" };
    }
    const matIds = await Material.find(matFilter).distinct("_id");
    const matClause = {
      material: { $in: matIds.length ? matIds : [] },
    };
    if (filter.material) {
      const existing = filter.material.toString();
      const allowed = matIds.map((id) => id.toString());
      if (!allowed.includes(existing)) {
        filter.material = { $in: [] };
      }
    } else {
      Object.assign(filter, matClause);
    }
  }

  if (reportedOnly) {
    const reportedSet = await getReportedInterestIdSet();
    filter._id = {
      $in: reportedSet.size
        ? [...reportedSet].map((id) => new mongoose.Types.ObjectId(id))
        : [],
    };
  }

  if (search.trim()) {
    const term = search.trim();
    const [buyerIds, providerIds, materialIds] = await Promise.all([
      User.find({ companyName: { $regex: term, $options: "i" } }).distinct("_id"),
      User.find({ companyName: { $regex: term, $options: "i" } }).distinct("_id"),
      Material.find({
        $or: [
          { title: { $regex: term, $options: "i" } },
          { materialType: { $regex: term, $options: "i" } },
        ],
      }).distinct("_id"),
    ]);
    const or = [];
    if (mongoose.Types.ObjectId.isValid(term)) {
      or.push({ _id: new mongoose.Types.ObjectId(term) });
    }
    if (buyerIds.length) or.push({ buyer: { $in: buyerIds } });
    if (providerIds.length) or.push({ provider: { $in: providerIds } });
    if (materialIds.length) or.push({ material: { $in: materialIds } });

    const intSuffix = term.replace(/^INT-/i, "").toUpperCase();
    if (/^[A-F0-9]{6,8}$/.test(intSuffix)) {
      const candidates = await Interest.find().select("_id").lean();
      const matched = candidates
        .filter((i) =>
          i._id.toString().toUpperCase().endsWith(intSuffix.slice(-8))
        )
        .map((i) => i._id);
      if (matched.length) or.push({ _id: { $in: matched } });
    }

    if (or.length) {
      filter.$and = filter.$and ?? [];
      filter.$and.push({ $or: or });
    }
  }

  return filter;
}

async function getAdminInterestSummary() {
  const reportedSet = await getReportedInterestIdSet();
  const [total, pending, inDiscussion, completed] = await Promise.all([
    Interest.countDocuments(),
    Interest.countDocuments({ status: "pending" }),
    Interest.countDocuments({
      status: { $in: ["discussion", "pickup_scheduled", "accepted"] },
    }),
    Interest.countDocuments({ status: "completed" }),
  ]);

  return {
    total,
    pending,
    inDiscussion,
    completed,
    reported: reportedSet.size,
  };
}

async function getInterestParticipantOptions() {
  const [buyerIds, providerIds] = await Promise.all([
    Interest.distinct("buyer"),
    Interest.distinct("provider"),
  ]);
  const allIds = [...new Set([...buyerIds, ...providerIds].map(String))];
  if (!allIds.length) return { buyers: [], providers: [] };

  const users = await User.find({ _id: { $in: allIds } })
    .select("companyName name role accountStatus")
    .lean();

  const buyers = users
    .filter((u) => u.role === "verified_buyer")
    .map((u) => ({
      id: u._id.toString(),
      companyName: u.companyName ?? "",
      name: u.name ?? "",
      accountStatus: u.accountStatus ?? "active",
    }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  const providers = users
    .filter((u) => u.role === "material_provider")
    .map((u) => ({
      id: u._id.toString(),
      companyName: u.companyName ?? "",
      name: u.name ?? "",
      accountStatus: u.accountStatus ?? "active",
    }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  return { buyers, providers };
}

async function getInterestMessageCountMap(conversationIds) {
  const map = new Map();
  if (!conversationIds.length) return map;

  const rows = await Message.aggregate([
    {
      $match: {
        conversation: {
          $in: conversationIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    map.set(row._id.toString(), row.count);
  }
  return map;
}

function mapAdminInterestRow(doc, buyer, provider, material, messageCount, reportCount) {
  const id = doc._id.toString();
  return {
    id,
    interestRefId: formatInterestRefId(id),
    status: doc.status,
    buyer: buyer
      ? {
          id: buyer._id.toString(),
          companyName: buyer.companyName ?? "",
          name: buyer.name ?? "",
          accountStatus: buyer.accountStatus ?? "active",
        }
      : null,
    provider: provider
      ? {
          id: provider._id.toString(),
          companyName: provider.companyName ?? "",
          name: provider.name ?? "",
          accountStatus: provider.accountStatus ?? "active",
        }
      : null,
    material: material
      ? {
          id: material._id.toString(),
          title: material.title,
          lotId: formatLotId(material._id),
          materialType: material.materialType,
          location: material.location ?? "",
          status: mapMaterialStatusForPublic(material.status),
        }
      : null,
    messageCount,
    reportCount,
    lastActivityAt: doc.updatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    conversationId: doc.conversation?.toString?.() ?? null,
  };
}

async function listAdminInterests({
  search = "",
  status,
  participant,
  scope,
  material,
  buyer,
  provider,
  materialType,
  location,
  reportedOnly = false,
  sort = "newest",
  page = 1,
  limit = 20,
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const match = await buildInterestMatchFilter({
    search,
    status,
    participant,
    scope,
    material,
    buyer,
    provider,
    materialType,
    location,
    reportedOnly: reportedOnly === true || reportedOnly === "true",
  });

  const [summary, total, materialTypes, participantOptions] = await Promise.all([
    getAdminInterestSummary(),
    Interest.countDocuments(match),
    Material.distinct("materialType"),
    getInterestParticipantOptions(),
  ]);

  const sortOpt =
    sort === "oldest"
      ? { createdAt: 1 }
      : sort === "most_messages" || sort === "most_reports"
        ? { updatedAt: -1 }
        : { createdAt: -1 };

  const docs = await Interest.find(match)
    .sort(sortOpt)
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const interestIds = docs.map((d) => d._id.toString());
  const buyerIds = [...new Set(docs.map((d) => d.buyer?.toString()).filter(Boolean))];
  const providerIds = [...new Set(docs.map((d) => d.provider?.toString()).filter(Boolean))];
  const materialIds = [...new Set(docs.map((d) => d.material?.toString()).filter(Boolean))];
  const conversationIds = docs
    .map((d) => d.conversation?.toString())
    .filter(Boolean);

  const [buyers, providers, materials, messageCountMap] = await Promise.all([
    buyerIds.length
      ? User.find({ _id: { $in: buyerIds } })
          .select("companyName name accountStatus")
          .lean()
      : [],
    providerIds.length
      ? User.find({ _id: { $in: providerIds } })
          .select("companyName name accountStatus")
          .lean()
      : [],
    materialIds.length
      ? Material.find({ _id: { $in: materialIds } })
          .select("title materialType location status")
          .lean()
      : [],
    getInterestMessageCountMap(conversationIds),
  ]);

  const buyerMap = new Map(buyers.map((b) => [b._id.toString(), b]));
  const providerMap = new Map(providers.map((p) => [p._id.toString(), p]));
  const materialMap = new Map(materials.map((m) => [m._id.toString(), m]));

  let items = await Promise.all(
    docs.map(async (doc) => {
      const id = doc._id.toString();
      const buyerDoc = buyerMap.get(doc.buyer?.toString() ?? "");
      const providerDoc = providerMap.get(doc.provider?.toString() ?? "");
      const materialDoc = materialMap.get(doc.material?.toString() ?? "");
      const convId = doc.conversation?.toString();
      const messageCount = convId ? messageCountMap.get(convId) ?? 0 : 0;
      const reportCount = await countOpenReportsForInterestTargets(
        doc.material,
        doc.buyer,
        doc.provider
      );
      return mapAdminInterestRow(
        doc,
        buyerDoc,
        providerDoc,
        materialDoc,
        messageCount,
        reportCount
      );
    })
  );

  if (sort === "most_messages") {
    items.sort(
      (a, b) =>
        b.messageCount - a.messageCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sort === "most_reports") {
    items.sort(
      (a, b) =>
        b.reportCount - a.reportCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    summary,
    materialTypes: materialTypes.filter(Boolean).sort(),
    buyers: participantOptions.buyers,
    providers: participantOptions.providers,
  };
}

async function getAdminInterestDetail(interestId) {
  const doc = await Interest.findById(interestId).lean();
  if (!doc) return null;

  const [buyer, provider, material, conversation, activityMap] = await Promise.all([
    User.findById(doc.buyer)
      .select("companyName name email role accountStatus createdAt updatedAt")
      .lean(),
    User.findById(doc.provider)
      .select("companyName name email role accountStatus createdAt updatedAt")
      .lean(),
    Material.findById(doc.material)
      .select("title materialType location status quantity unit description")
      .lean(),
    doc.conversation
      ? Conversation.findById(doc.conversation).lean()
      : null,
    getLastActivityMap([
      doc.buyer?.toString(),
      doc.provider?.toString(),
    ].filter(Boolean)),
  ]);

  if (!buyer || !provider || !material) return null;

  const reportDocs = await getReportsForInterestTargets(
    doc.material,
    doc.buyer,
    doc.provider
  );
  const openReports = reportDocs.filter((r) => r.status === "open");
  const resolvedReports = reportDocs.filter((r) => r.status === "resolved");

  let messageCount = 0;
  let firstContactAt = null;
  let latestMessages = [];

  if (doc.conversation) {
    const [count, firstMsg, messages] = await Promise.all([
      Message.countDocuments({ conversation: doc.conversation }),
      Message.findOne({ conversation: doc.conversation })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean(),
      Message.find({ conversation: doc.conversation })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("sender", "name companyName")
        .lean(),
    ]);
    messageCount = count;
    firstContactAt = firstMsg?.createdAt ?? null;
    latestMessages = messages.reverse().map((m) => {
      const sender = m.sender;
      return {
        id: m._id.toString(),
        senderId: sender?._id?.toString?.() ?? m.sender?.toString?.(),
        senderName: sender?.name ?? "",
        senderCompany: sender?.companyName ?? "",
        content: m.content,
        isSystem: Boolean(m.isSystem),
        createdAt: m.createdAt,
      };
    });
  }

  const lastActivityAt = doc.updatedAt;
  const buyerLastActivity =
    activityMap.get(buyer._id.toString()) ?? buyer.updatedAt ?? buyer.createdAt;
  const providerLastActivity =
    activityMap.get(provider._id.toString()) ?? provider.updatedAt ?? provider.createdAt;

  return {
    interest: {
      id: doc._id.toString(),
      interestRefId: formatInterestRefId(doc._id),
      status: doc.status,
      message: doc.message ?? "",
      pickupTimeline: doc.pickupTimeline ?? "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastActivityAt,
      conversationId: doc.conversation?.toString() ?? null,
    },
    buyer: {
      id: buyer._id.toString(),
      companyName: buyer.companyName,
      name: buyer.name,
      email: buyer.email,
      role: buyer.role,
      accountStatus: buyer.accountStatus ?? "active",
      createdAt: buyer.createdAt,
      lastActivityAt: buyerLastActivity,
    },
    provider: {
      id: provider._id.toString(),
      companyName: provider.companyName,
      name: provider.name,
      email: provider.email,
      role: provider.role,
      accountStatus: provider.accountStatus ?? "active",
      createdAt: provider.createdAt,
      lastActivityAt: providerLastActivity,
    },
    material: {
      id: material._id.toString(),
      title: material.title,
      lotId: formatLotId(material._id),
      materialType: material.materialType,
      location: material.location,
      quantity: material.quantity,
      unit: material.unit,
      description: material.description ?? "",
      status: mapMaterialStatusForPublic(material.status),
    },
    activity: {
      messageCount,
      discussionStatus: conversation?.status ?? "none",
      firstContactAt,
      lastActivityAt,
    },
    conversation: conversation
      ? {
          id: conversation._id.toString(),
          status: conversation.status,
          lastMessageAt: conversation.lastMessageAt,
          buyerId: conversation.buyer.toString(),
          providerId: conversation.provider.toString(),
        }
      : null,
    messages: latestMessages,
    reports: {
      open: openReports.map((r) => ({
        id: r._id.toString(),
        reason: r.reason,
        details: r.details,
        status: r.status,
        targetType: r.targetType,
        createdAt: r.createdAt,
      })),
      resolved: resolvedReports.map((r) => ({
        id: r._id.toString(),
        reason: r.reason,
        details: r.details,
        status: r.status,
        targetType: r.targetType,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
      history: reportDocs.map((r) => ({
        id: r._id.toString(),
        reason: r.reason,
        details: r.details,
        status: r.status,
        targetType: r.targetType,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
    },
  };
}

module.exports = {
  getDashboardStats,
  listParticipants,
  getParticipantDetail,
  patchParticipantAccount,
  listEnrichedReports,
  listAdminReports,
  getAdminReportDetail,
  listAdminMaterials,
  getAdminMaterialDetail,
  moderateAdminMaterial,
  bulkModerateAdminMaterials,
  listAdminInterests,
  getAdminInterestDetail,
};
