const {
  normalizeCountryCode,
  isIndiaCountry,
} = require("./marketScope");

function normKey(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function firstSegment(value) {
  const s = (value ?? "").toString().trim();
  if (!s) return "";
  return s.split(",")[0].trim();
}

/**
 * Structured { country, state, city } from user profile fields.
 */
function resolveUserLocation(user) {
  if (!user) return { country: "IN", state: "", city: "" };
  const country = normalizeCountryCode(user.country);
  const state = (user.state ?? "").toString().trim();
  const city = (user.city ?? user.location ?? "").toString().trim();

  if (!isIndiaCountry(country)) {
    return {
      country,
      state: "",
      city: firstSegment(city) || country,
    };
  }

  if (state && city) return { country, state, city: firstSegment(city) };
  if (state) return { country, state, city: firstSegment(city) };
  const loc = (user.location ?? "").toString().trim();
  if (!loc) return { country, state: "", city: "" };
  const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { country, city: parts[0], state: parts[parts.length - 1] };
  }
  return { country, state: "", city: firstSegment(loc) };
}

/**
 * Material location inherits provider country/state/city when not structured.
 */
function resolveMaterialLocation(material, provider) {
  const providerLoc = resolveUserLocation(provider);
  const country = normalizeCountryCode(
    material?.country ?? providerLoc.country ?? "IN"
  );

  if (!isIndiaCountry(country)) {
    const raw = (material?.location ?? "").toString().trim();
    return {
      country,
      state: "",
      city: firstSegment(raw) || country,
    };
  }

  const raw = (material?.location ?? "").toString().trim();
  if (!raw) return { ...providerLoc, country };

  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const maybeState = parts[parts.length - 1];
    const maybeCity = parts[0];
    if (providerLoc.state && normKey(maybeState) === normKey(providerLoc.state)) {
      return { country, state: providerLoc.state, city: maybeCity };
    }
    return { country, city: maybeCity, state: maybeState };
  }

  if (providerLoc.state) {
    return {
      country,
      state: providerLoc.state,
      city: firstSegment(raw) || providerLoc.city,
    };
  }
  return { country, state: "", city: firstSegment(raw) };
}

function isSameCountry(buyerLoc, sellerLoc) {
  const b = normalizeCountryCode(buyerLoc?.country);
  const s = normalizeCountryCode(sellerLoc?.country);
  return Boolean(b && s && b === s);
}

/**
 * MVP location score:
 * - India: same city +30, same state +15
 * - Abroad: same country +30 only (no city/state proximity)
 */
function scoreLocationMatch(buyerLoc, sellerLoc) {
  const bCountry = normalizeCountryCode(buyerLoc?.country);
  const sCountry = normalizeCountryCode(sellerLoc?.country);

  if (!isIndiaCountry(bCountry) || !isIndiaCountry(sCountry)) {
    return bCountry && sCountry && bCountry === sCountry ? 30 : 0;
  }

  const bState = normKey(buyerLoc?.state);
  const bCity = normKey(buyerLoc?.city);
  const sState = normKey(sellerLoc?.state);
  const sCity = normKey(sellerLoc?.city);

  if (bCity && sCity && bCity === sCity) return 30;
  if (bState && sState && bState === sState) return 15;
  return 0;
}

function isSameState(buyerLoc, sellerLoc) {
  if (
    !isIndiaCountry(buyerLoc?.country) ||
    !isIndiaCountry(sellerLoc?.country)
  ) {
    return false;
  }
  const bState = normKey(buyerLoc?.state);
  const sState = normKey(sellerLoc?.state);
  return Boolean(bState && sState && bState === sState);
}

function isDifferentState(buyerLoc, sellerLoc) {
  if (
    !isIndiaCountry(buyerLoc?.country) ||
    !isIndiaCountry(sellerLoc?.country)
  ) {
    return false;
  }
  const bState = normKey(buyerLoc?.state);
  const sState = normKey(sellerLoc?.state);
  if (!bState || !sState) return false;
  return bState !== sState;
}

/**
 * Human-readable location context for match cards.
 */
function buildMatchLocationContext(buyerLoc, sellerLoc) {
  const bCountry = normalizeCountryCode(buyerLoc?.country);
  const sCountry = normalizeCountryCode(sellerLoc?.country);
  const sellerStateLabel = (sellerLoc?.state ?? "").trim();
  const sellerCityLabel = (sellerLoc?.city ?? "").trim();

  if (!isIndiaCountry(bCountry) || !isIndiaCountry(sCountry)) {
    if (bCountry && sCountry && bCountry === sCountry) {
      return {
        locationScope: "same_country",
        locationNote: "Same country as you",
      };
    }
    return {
      locationScope: "other_country",
      locationNote: sCountry ? `Located in ${sCountry}` : "",
    };
  }

  if (!sellerStateLabel && !sellerCityLabel) {
    return { locationScope: "unknown", locationNote: "" };
  }

  const bState = normKey(buyerLoc?.state);
  const sState = normKey(sellerLoc?.state);
  const bCity = normKey(buyerLoc?.city);
  const sCity = normKey(sellerLoc?.city);

  if (bCity && sCity && bCity === sCity) {
    return {
      locationScope: "same_city",
      locationNote: "Same city as you",
    };
  }

  if (bState && sState && bState === sState) {
    return {
      locationScope: "same_state",
      locationNote: sellerCityLabel
        ? `In your state · ${sellerCityLabel}`
        : `In your state (${sellerStateLabel})`,
    };
  }

  if (bState && sState && bState !== sState) {
    return {
      locationScope: "other_state",
      locationNote: sellerStateLabel
        ? `Different state · material in ${sellerStateLabel}`
        : "Different state",
    };
  }

  return {
    locationScope: "unknown",
    locationNote: sellerStateLabel
      ? `Located in ${sellerStateLabel}`
      : sellerCityLabel,
  };
}

module.exports = {
  resolveUserLocation,
  resolveMaterialLocation,
  scoreLocationMatch,
  isSameState,
  isDifferentState,
  isSameCountry,
  buildMatchLocationContext,
};
