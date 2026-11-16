const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  safeParseInsightBody,
  safeParseListAdminInsights,
  safeParseListPublicInsights,
} = require("./content-insight.validation");
const {
  listPublicInsights,
  getPublicInsightBySlug,
  listAdminInsights,
  getAdminInsightById,
  createInsight,
  updateInsight,
  deleteInsight,
} = require("./content-insight.service");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

const getPublicInsights = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListPublicInsights(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }
  const result = await listPublicInsights(parsed.data);
  sendSuccess(res, result, "Public insights");
});

const getPublicInsight = asyncHandler(async (req, res) => {
  const result = await getPublicInsightBySlug(req.params.slug);
  sendSuccess(res, result, "Public insight");
});

const getAdminInsights = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminInsights(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }
  const result = await listAdminInsights(parsed.data);
  sendSuccess(res, result, "Admin insights");
});

const getAdminInsight = asyncHandler(async (req, res) => {
  const result = await getAdminInsightById(req.params.insightId);
  sendSuccess(res, result, "Admin insight");
});

const postAdminInsight = asyncHandler(async (req, res, next) => {
  const parsed = safeParseInsightBody(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }
  const result = await createInsight(parsed.data, req.user?.id);
  sendSuccess(res, result, "Insight created", 201);
});

const patchAdminInsight = asyncHandler(async (req, res, next) => {
  const parsed = safeParseInsightBody(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }
  const result = await updateInsight(
    req.params.insightId,
    parsed.data,
    req.user?.id
  );
  sendSuccess(res, result, "Insight updated");
});

const deleteAdminInsight = asyncHandler(async (req, res) => {
  const result = await deleteInsight(req.params.insightId);
  sendSuccess(res, result, "Insight deleted");
});

module.exports = {
  getPublicInsights,
  getPublicInsight,
  getAdminInsights,
  getAdminInsight,
  postAdminInsight,
  patchAdminInsight,
  deleteAdminInsight,
};
