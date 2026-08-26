const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  isEmailConfigured,
  sendSupportContactEmail,
} = require("../../services/email/email.service");
const { safeParseContact } = require("./support.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function createSupportController(env) {
  const submitContact = asyncHandler(async (req, res, next) => {
    const parsed = safeParseContact(req.body);
    if (!parsed.success) {
      validationError(next, parsed.error.flatten());
      return;
    }

    const data = parsed.data;

    // Silent success for bots that fill the honeypot
    if (data.website) {
      sendSuccess(res, { submitted: true }, "Message sent", 201);
      return;
    }

    if (!isEmailConfigured(env) && env.NODE_ENV === "production") {
      next(
        new AppError(
          "Support messaging is temporarily unavailable",
          503,
          "EMAIL_UNAVAILABLE"
        )
      );
      return;
    }

    try {
      await sendSupportContactEmail(env, {
        name: data.name,
        email: data.email,
        category: data.category,
        description: data.description,
        companyName: data.companyName || undefined,
        source: data.source,
        pageUrl: data.pageUrl || undefined,
        userId: req.user?.id,
      });
    } catch (err) {
      next(
        new AppError(
          "Unable to send your message right now. Please try again shortly.",
          502,
          "EMAIL_DELIVERY_FAILED"
        )
      );
      return;
    }

    sendSuccess(res, { submitted: true }, "Message sent", 201);
  });

  return { submitContact };
}

module.exports = { createSupportController };
