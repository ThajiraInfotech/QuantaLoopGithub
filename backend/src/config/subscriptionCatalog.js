const { AppError } = require("../utils/AppError");
const { isIndiaCountry } = require("../utils/marketScope");

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

/** Default overseas list price: $99.00 */
const DEFAULT_USD_AMOUNT_CENTS = 9900;

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

function resolveAnnualAmountOverridePaise(env) {
  const raw = env?.ANNUAL_ACCESS_AMOUNT_PAISE;
  if (raw == null || String(raw).trim() === "") return null;
  const paise = Number(raw);
  if (!Number.isInteger(paise) || paise < 100) {
    throw new Error(
      "ANNUAL_ACCESS_AMOUNT_PAISE must be an integer >= 100 (₹1.00)"
    );
  }
  return paise;
}

function resolveAnnualUsdAmountCents(env) {
  const raw = env?.ANNUAL_ACCESS_USD_AMOUNT_CENTS;
  if (raw == null || String(raw).trim() === "") return DEFAULT_USD_AMOUNT_CENTS;
  const cents = Number(raw);
  if (!Number.isInteger(cents) || cents < 100) {
    throw new Error(
      "ANNUAL_ACCESS_USD_AMOUNT_CENTS must be an integer >= 100 ($1.00)"
    );
  }
  return cents;
}

function withAnnualAmountOverride(plan, overridePaise) {
  if (!overridePaise || plan.id !== "annual_access") return plan;
  return {
    ...plan,
    amountMinor: overridePaise,
    amount: overridePaise / 100,
  };
}

function withUsdPricing(plan, usdCents) {
  if (plan.id !== "annual_access") return plan;
  return {
    ...plan,
    currency: "USD",
    amountMinor: usdCents,
    amount: usdCents / 100,
  };
}

function createSubscriptionCatalog(env) {
  const planMap = configuredPlanMap(env || {});
  const paymentsConfigured = Boolean(
    env?.RAZORPAY_KEY_ID && env?.RAZORPAY_KEY_SECRET
  );
  const annualOverridePaise = resolveAnnualAmountOverridePaise(env || {});
  const annualUsdCents = resolveAnnualUsdAmountCents(env || {});

  function basePlan(catalogPlanId) {
    const plan = CATALOG[catalogPlanId];
    if (!plan) {
      throw new AppError("Plan is not available", 404, "PLAN_NOT_AVAILABLE");
    }
    const resolved = withAnnualAmountOverride(plan, annualOverridePaise);
    return {
      ...resolved,
      razorpayPlanId: planMap[catalogPlanId] || null,
    };
  }

  function listCatalogPlans() {
    return Object.values(CATALOG).map((plan) => {
      const resolved = withAnnualAmountOverride(plan, annualOverridePaise);
      return {
        ...resolved,
        razorpayPlanId: planMap[plan.id] || null,
        // One-time Orders checkout only needs API keys — no Razorpay plan.
        purchasable: paymentsConfigured,
        amountUsd: annualUsdCents / 100,
        amountUsdMinor: annualUsdCents,
      };
    });
  }

  function listPurchasablePlans() {
    return listCatalogPlans()
      .filter((plan) => plan.purchasable)
      .map(({ razorpayPlanId, purchasable, totalCount, ...plan }) => plan);
  }

  /** India (INR) catalog price. Prefer getPlanForCountry at checkout. */
  function getPlan(catalogPlanId) {
    return basePlan(catalogPlanId);
  }

  /**
   * Same membership SKU; currency follows billing country.
   * IN → INR, anywhere else → USD.
   */
  function getPlanForCountry(catalogPlanId, country) {
    const plan = basePlan(catalogPlanId);
    if (isIndiaCountry(country)) return plan;
    return withUsdPricing(plan, annualUsdCents);
  }

  /** Resolve catalog price for a captured Razorpay payment currency. */
  function getPlanForCurrency(catalogPlanId, currency) {
    const code = String(currency || "INR").trim().toUpperCase();
    const plan = basePlan(catalogPlanId);
    if (code === "USD") return withUsdPricing(plan, annualUsdCents);
    if (code === "INR") return plan;
    throw new AppError(
      "Unsupported checkout currency",
      400,
      "UNSUPPORTED_CURRENCY"
    );
  }

  return {
    getPlan,
    getPlanForCountry,
    getPlanForCurrency,
    listCatalogPlans,
    listPurchasablePlans,
    planMap,
    annualUsdCents,
  };
}

module.exports = {
  CATALOG,
  DEFAULT_USD_AMOUNT_CENTS,
  parsePlanMap,
  configuredPlanMap,
  createSubscriptionCatalog,
};
