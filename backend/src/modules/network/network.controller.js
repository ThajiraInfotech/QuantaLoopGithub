const { z } = require("zod");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  getNetworkOverview,
  createIntroductionRequest,
} = require("./network.service");

const introBodySchema = z.object({
  buyerId: z.string().min(1),
  message: z.string().max(2000).optional(),
  materialId: z.string().optional(),
});

const overview = asyncHandler(async (req, res) => {
  const data = await getNetworkOverview();
  sendSuccess(res, data, "Network overview retrieved");
});

const requestIntroduction = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "material_provider" && req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = introBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(
      new AppError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten())
    );
    return;
  }

  const result = await createIntroductionRequest(
    req.user.id,
    parsed.data.buyerId,
    {
      message: parsed.data.message,
      materialId: parsed.data.materialId,
    }
  );

  sendSuccess(
    res,
    { introduction: result },
    "Introduction request sent to the buyer",
    201
  );
});

module.exports = { overview, requestIntroduction };
