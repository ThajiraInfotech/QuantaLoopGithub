const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  getDatasetMeta,
  isKnownStateCode,
  resolveCity,
  searchCities,
} = require("./location.service");

const getMeta = asyncHandler(async (req, res) => {
  sendSuccess(res, getDatasetMeta(), "Location dataset metadata");
});

const searchCitiesHandler = asyncHandler(async (req, res) => {
  const stateCode = (req.query.stateCode ?? "").toString().trim().toUpperCase();
  const search = (req.query.search ?? "").toString();
  const limit = Number.parseInt(req.query.limit ?? "30", 10);

  if (!stateCode) {
    return res.status(400).json({
      success: false,
      message: "stateCode is required",
    });
  }

  if (!isKnownStateCode(stateCode)) {
    return res.status(404).json({
      success: false,
      message: "Unknown state code",
    });
  }

  const result = searchCities(
    stateCode,
    search,
    Number.isFinite(limit) ? limit : 30,
  );
  sendSuccess(
    res,
    {
      stateCode,
      total: result.total,
      matched: result.matched,
      cities: result.cities,
    },
    "Cities retrieved",
  );
});

const resolveCityHandler = asyncHandler(async (req, res) => {
  const stateCode = (req.query.stateCode ?? "").toString().trim().toUpperCase();
  const city = (req.query.city ?? "").toString();

  if (!stateCode || !city.trim()) {
    return res.status(400).json({
      success: false,
      message: "stateCode and city are required",
    });
  }

  if (!isKnownStateCode(stateCode)) {
    return res.status(404).json({
      success: false,
      message: "Unknown state code",
    });
  }

  const resolved = resolveCity(stateCode, city);
  if (!resolved) {
    return res.status(404).json({
      success: false,
      message: "City not found for this state",
    });
  }

  sendSuccess(res, { stateCode, city: resolved }, "City resolved");
});

module.exports = {
  getMeta,
  searchCitiesHandler,
  resolveCityHandler,
};
