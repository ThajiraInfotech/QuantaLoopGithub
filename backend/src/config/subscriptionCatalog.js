const { AppError } = require("../utils/AppError");

const CATALOG = Object.freeze({
  annual_access: Object.freeze({
    id: "annual_access",
    code: "annual_access",
    name: "Annual network access",
    description:
      "Annual access to industrial demand and recovery opportunities on Quanta Loop.",
    amount: 6999,
    amountMinor: 699900,
    currency: "INR",
    interval: "yearly",
    period: "yearly",
    intervalCount: 1,
    // Test-mode product decision: one annual charge. Raising this count later
    // restores recurring yearly billing without changing entitlement logic.
    totalCount: 1,
  }),
});

function parsePlanMap(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("must be a JSON object");
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([catalogId, razorpayPlanId]) =>
          CATALOG[catalogId] &&
          typeof razorpayPlanId === "string" &&
          /^plan_[A-Za-z0-9]+$/.test(razorpayPlanId)
      )
    );
  } catch (error) {
    throw new Error(`Invalid RAZORPAY_PLAN_MAP: ${error.message}`);
  }
}

function configuredPlanMap(env) {
  const fromJson = parsePlanMap(env.RAZORPAY_PLAN_MAP);
  const annual = env.RAZORPAY_PLAN_ID_ANNUAL_ACCESS;
  if (annual && /^plan_[A-Za-z0-9]+$/.test(annual)) {
    return { annual_access: annual, ...fromJson };
  }
  return fromJson;
}

function createSubscriptionCatalog(env) {
  const planMap = configuredPlanMap(env || {});

  function listCatalogPlans() {
    return Object.values(CATALOG).map((plan) => ({
      ...plan,
      razorpayPlanId: planMap[plan.id] || null,
      purchasable: Boolean(planMap[plan.id]),
    }));
  }

  function listPurchasablePlans() {
    return listCatalogPlans()
      .filter((plan) => plan.purchasable)
      .map(({ razorpayPlanId, purchasable, totalCount, ...plan }) => plan);
  }

  function getPlan(catalogPlanId) {
    const plan = CATALOG[catalogPlanId];
    if (!plan) {
      throw new AppError("Plan is not available", 404, "PLAN_NOT_AVAILABLE");
    }
    return {
      ...plan,
      razorpayPlanId: planMap[catalogPlanId] || null,
    };
  }

  return { getPlan, listCatalogPlans, listPurchasablePlans, planMap };
}

module.exports = {
  CATALOG,
  parsePlanMap,
  configuredPlanMap,
  createSubscriptionCatalog,
};
