const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { safeParseContact } = require("./support.validation");
const { createSupportRequest } = require("./support.service");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function createSupportController() {
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

    try {
      const request = await createSupportRequest(data, req.user?.id);
      sendSuccess(res, { submitted: true, id: request.id }, "Message sent", 201);
    } catch (err) {
      next(
        new AppError(
          "Unable to save your message right now. Please try again shortly.",
          500,
          "SUPPORT_SAVE_FAILED"
        )
      );
    }
  });

  return { submitContact };
}

module.exports = { createSupportController };
