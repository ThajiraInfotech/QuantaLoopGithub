const { AppError } = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  upsertBillingProfileSchema,
  previewSchema,
  parseOrThrow,
} = require("./billing.validation");

function validationFailure(result) {
  throw new AppError(
    "Validation failed",
    400,
    "VALIDATION_ERROR",
    result.error.flatten()
  );
}

function createBillingController({ service }) {
  const getProfile = asyncHandler(async (req, res) => {
    const profile = await service.getProfile(req.user.id);
    sendSuccess(res, { profile }, "Billing profile retrieved");
  });

  const upsertProfile = asyncHandler(async (req, res) => {
    const result = parseOrThrow(upsertBillingProfileSchema, req.body);
    if (!result.success) validationFailure(result);
    const data = await service.upsertProfile(req.user.id, result.data, {
      email: req.user.email,
    });
    sendSuccess(res, data, "Billing profile saved", 200);
  });

  const previewTax = asyncHandler(async (req, res) => {
    const result = parseOrThrow(previewSchema, {
      planCode: req.query.planCode || req.body?.planCode,
      planId: req.query.planId || req.body?.planId,
    });
    if (!result.success) validationFailure(result);
    const planId = result.data.planId || result.data.planCode || "annual_access";
    const taxPreview = await service.previewTax(req.user.id, planId);
    sendSuccess(res, { taxPreview }, "Tax preview calculated");
  });

  const listInvoices = asyncHandler(async (req, res) => {
    const invoices = await service.listInvoices(req.user.id);
    sendSuccess(res, { invoices }, "Invoices retrieved");
  });

  const getInvoice = asyncHandler(async (req, res) => {
    const invoice = await service.getInvoiceForUser(
      req.user.id,
      req.params.invoiceId
    );
    sendSuccess(res, { invoice }, "Invoice retrieved");
  });

  const getInvoiceHtml = asyncHandler(async (req, res) => {
    const html = await service.getInvoiceHtmlForUser(
      req.user.id,
      req.params.invoiceId
    );
    res.status(200).type("html").send(html);
  });

  return {
    getProfile,
    upsertProfile,
    previewTax,
    listInvoices,
    getInvoice,
    getInvoiceHtml,
  };
}

module.exports = { createBillingController };
