const { User } = require("../users/user.model");
const {
  SupportRequest,
  formatSupportRefId,
  toPublicSupportRequest,
} = require("./support-request.model");

async function createSupportRequest(data, userId) {
  const doc = await SupportRequest.create({
    name: data.name,
    email: data.email,
    category: data.category,
    description: data.description,
    companyName: data.companyName || "",
    source: data.source,
    pageUrl: data.pageUrl || "",
    user: userId || null,
  });
  return toPublicSupportRequest(doc);
}

function buildSupportRequestMatchFilter({
  search = "",
  status = "open",
  category = "all",
  source = "all",
  dateFrom = "",
  dateTo = "",
}) {
  const match = {};

  if (status && status !== "all") {
    match.status = status;
  }

  if (category && category !== "all") {
    match.category = category;
  }

  if (source && source !== "all") {
    match.source = source;
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const regex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    match.$or = [
      { name: regex },
      { email: regex },
      { companyName: regex },
      { description: regex },
    ];
  }

  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        match.createdAt.$gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }
    if (Object.keys(match.createdAt).length === 0) {
      delete match.createdAt;
    }
  }

  return match;
}

async function getAdminSupportRequestSummary() {
  const [total, open, resolved] = await Promise.all([
    SupportRequest.countDocuments(),
    SupportRequest.countDocuments({ status: "open" }),
    SupportRequest.countDocuments({ status: "resolved" }),
  ]);

  return { total, open, resolved };
}

function mapAdminSupportRequestRow(doc, resolver) {
  const id = doc._id.toString();
  return {
    id,
    supportRefId: formatSupportRefId(doc._id),
    name: doc.name,
    email: doc.email,
    category: doc.category,
    description: doc.description,
    companyName: doc.companyName ?? "",
    source: doc.source,
    pageUrl: doc.pageUrl ?? "",
    userId: doc.user?.toString?.() ?? null,
    status: doc.status,
    resolvedAt: doc.resolvedAt ?? null,
    resolvedById: doc.resolvedBy?.toString?.() ?? null,
    resolvedByName: resolver?.name ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listAdminSupportRequests({
  search = "",
  status = "open",
  category = "all",
  source = "all",
  dateFrom = "",
  dateTo = "",
  sort = "newest",
  page = 1,
  limit = 20,
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const match = buildSupportRequestMatchFilter({
    search,
    status,
    category,
    source,
    dateFrom,
    dateTo,
  });

  const [summary, total] = await Promise.all([
    getAdminSupportRequestSummary(),
    SupportRequest.countDocuments(match),
  ]);

  const sortOpt = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const docs = await SupportRequest.find(match)
    .sort(sortOpt)
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const resolverIds = docs
    .map((d) => d.resolvedBy?.toString?.())
    .filter(Boolean);
  const resolvers = resolverIds.length
    ? await User.find({ _id: { $in: resolverIds } })
        .select("name companyName")
        .lean()
    : [];
  const resolverMap = new Map(resolvers.map((u) => [u._id.toString(), u]));

  const items = docs.map((doc) =>
    mapAdminSupportRequestRow(
      doc,
      doc.resolvedBy ? resolverMap.get(doc.resolvedBy.toString()) : null
    )
  );

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    summary,
  };
}

async function getAdminSupportRequestDetail(requestId) {
  const doc = await SupportRequest.findById(requestId).lean();
  if (!doc) return null;

  const [linkedUser, resolver] = await Promise.all([
    doc.user
      ? User.findById(doc.user)
          .select("name companyName email role accountStatus createdAt")
          .lean()
      : null,
    doc.resolvedBy
      ? User.findById(doc.resolvedBy).select("name companyName").lean()
      : null,
  ]);

  const request = mapAdminSupportRequestRow(doc, resolver);

  return {
    request,
    linkedUser: linkedUser
      ? {
          id: linkedUser._id.toString(),
          name: linkedUser.name,
          companyName: linkedUser.companyName,
          email: linkedUser.email,
          role: linkedUser.role,
          accountStatus: linkedUser.accountStatus ?? "active",
          createdAt: linkedUser.createdAt,
        }
      : null,
    resolution: {
      status: doc.status,
      resolvedAt: doc.resolvedAt ?? null,
      resolvedById: doc.resolvedBy?.toString?.() ?? null,
      resolvedByName: resolver?.name ?? null,
      resolvedByCompany: resolver?.companyName ?? null,
    },
    history: [
      {
        type: "created",
        label: "Support request submitted",
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
          ]
        : []),
    ],
  };
}

async function resolveSupportRequest(requestId, adminUserId) {
  const doc = await SupportRequest.findOneAndUpdate(
    { _id: requestId, status: "open" },
    {
      status: "resolved",
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!doc) return null;
  return toPublicSupportRequest(doc);
}

async function countOpenSupportRequests() {
  return SupportRequest.countDocuments({ status: "open" });
}

module.exports = {
  createSupportRequest,
  listAdminSupportRequests,
  getAdminSupportRequestDetail,
  resolveSupportRequest,
  countOpenSupportRequests,
};
