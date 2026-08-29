const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
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
  requestAdminPasswordChange,
  confirmAdminPasswordChange,
} = require("./admin.service");
const {
  safeParseListParticipants,
  safeParseAccountStatus,
  safeParseListAdminMaterials,
  safeParseModerateMaterial,
  safeParseBulkModerateMaterials,
  safeParseListAdminInterests,
  safeParseListAdminReports,
  safeParseListAdminSupportRequests,
  safeParseListAdminInvoices,
  safeParseAdminChangePasswordRequest,
  safeParseAdminChangePasswordConfirm,
} = require("./admin.validation");
const { createSubscriptionCatalog } = require("../../config/subscriptionCatalog");
const { createBillingService } = require("../billing/billing.service");

const {
  listAdminSupportRequests,
  getAdminSupportRequestDetail,
  resolveSupportRequest,
} = require("../support/support.service");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function billingServiceFor(req) {
  const env = req.app.locals.env;
  return createBillingService({
    env,
    catalog: createSubscriptionCatalog(env),
  });
}

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  sendSuccess(res, stats, "Admin dashboard");
});

const getParticipants = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListParticipants(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await listParticipants(parsed.data);
  sendSuccess(res, result, "Participants");
});

const patchParticipant = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    next(new AppError("Invalid user id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseAccountStatus(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const user = await patchParticipantAccount(userId, parsed.data.accountStatus);
  if (!user) {
    next(new AppError("Participant not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, { user }, "Account status updated");
});

const getParticipant = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    next(new AppError("Invalid user id", 400, "INVALID_ID"));
    return;
  }

  const detail = await getParticipantDetail(userId);
  if (!detail) {
    next(new AppError("Participant not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, detail, "Participant detail");
});

const getReports = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminReports(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await listAdminReports(parsed.data);
  sendSuccess(res, result, "Reports retrieved");
});

const getReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    next(new AppError("Invalid report id", 400, "INVALID_ID"));
    return;
  }

  const detail = await getAdminReportDetail(reportId);
  if (!detail) {
    next(new AppError("Report not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, detail, "Report detail");
});

const getSupportRequests = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminSupportRequests(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await listAdminSupportRequests(parsed.data);
  sendSuccess(res, result, "Support requests retrieved");
});

const getSupportRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    next(new AppError("Invalid support request id", 400, "INVALID_ID"));
    return;
  }

  const detail = await getAdminSupportRequestDetail(requestId);
  if (!detail) {
    next(new AppError("Support request not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, detail, "Support request detail");
});

const patchSupportRequestResolve = asyncHandler(async (req, res, next) => {
  const { requestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    next(new AppError("Invalid support request id", 400, "INVALID_ID"));
    return;
  }

  const updated = await resolveSupportRequest(requestId, req.user.id);
  if (!updated) {
    next(
      new AppError(
        "Support request not found or already resolved",
        404,
        "NOT_FOUND"
      )
    );
    return;
  }

  sendSuccess(res, { request: updated }, "Support request resolved");
});

const getMaterials = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminMaterials(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await listAdminMaterials(parsed.data);
  sendSuccess(res, result, "Materials");
});

const getMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const detail = await getAdminMaterialDetail(materialId);
  if (!detail) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, detail, "Material detail");
});

const patchMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseModerateMaterial(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const id = await moderateAdminMaterial(materialId, parsed.data.action);
  if (!id) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, { id }, "Material updated");
});

const postMaterialsBulk = asyncHandler(async (req, res, next) => {
  const parsed = safeParseBulkModerateMaterials(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await bulkModerateAdminMaterials(
    parsed.data.ids,
    parsed.data.action
  );
  sendSuccess(res, result, "Bulk update complete");
});

const getInterests = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminInterests(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await listAdminInterests(parsed.data);
  sendSuccess(res, result, "Interests");
});

const getInterest = asyncHandler(async (req, res, next) => {
  const { interestId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(interestId)) {
    next(new AppError("Invalid interest id", 400, "INVALID_ID"));
    return;
  }

  const detail = await getAdminInterestDetail(interestId);
  if (!detail) {
    next(new AppError("Interest not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, detail, "Interest detail");
});

const getInvoices = asyncHandler(async (req, res, next) => {
  const parsed = safeParseListAdminInvoices(req.query);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }
  const result = await billingServiceFor(req).listAdminInvoices({
    ...parsed.data,
    month: parsed.data.month || undefined,
  });
  sendSuccess(res, result, "Invoices");
});

const getInvoiceHtml = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    next(new AppError("Invalid invoice id", 400, "INVALID_ID"));
    return;
  }
  const html = await billingServiceFor(req).getAdminInvoiceHtml(invoiceId);
  res.status(200).type("html").send(html);
});

const postPasswordChangeRequest = asyncHandler(async (req, res, next) => {
  const parsed = safeParseAdminChangePasswordRequest(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await requestAdminPasswordChange(
    req.user.id,
    parsed.data,
    req.app.locals.env
  );
  sendSuccess(res, result, "Confirmation code sent");
});

const postPasswordChangeConfirm = asyncHandler(async (req, res, next) => {
  const parsed = safeParseAdminChangePasswordConfirm(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const result = await confirmAdminPasswordChange(req.user.id, parsed.data);
  sendSuccess(res, result, "Password updated");
});

module.exports = {
  getDashboard,
  getParticipants,
  getParticipant,
  patchParticipant,
  getReports,
  getReport,
  getSupportRequests,
  getSupportRequest,
  patchSupportRequestResolve,
  getMaterials,
  getMaterial,
  patchMaterial,
  postMaterialsBulk,
  getInterests,
  getInterest,
  getInvoices,
  getInvoiceHtml,
  postPasswordChangeRequest,
  postPasswordChangeConfirm,
};
