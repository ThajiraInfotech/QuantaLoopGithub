/** ISO-ish country helpers for additive international expansion. */

function normalizeCountryCode(value) {
  const raw = (value ?? "").toString().trim().toUpperCase();
  if (!raw) return "IN";
  if (raw === "INDIA") return "IN";
  if (raw.length === 2) return raw;
  return raw.slice(0, 8);
}

function isIndiaCountry(value) {
  return normalizeCountryCode(value) === "IN";
}

/**
 * Domestic India listing (not expanded to abroad buyers).
 * Missing fields default to India-only for backward compatibility.
 */
function isIndiaDomesticListing(material) {
  const country = normalizeCountryCode(material?.country);
  const scope = (material?.marketScope ?? "india").toString().trim().toLowerCase();
  return country === "IN" && scope !== "global";
}

/** Visible to abroad buyers: global India listings or any non-India listing. */
function isInternationallyVisible(material) {
  const country = normalizeCountryCode(material?.country);
  const scope = (material?.marketScope ?? "india").toString().trim().toLowerCase();
  if (country !== "IN") return true;
  return scope === "global";
}

/** Outside India — for Indian buyer Global tab. */
function isOutsideIndiaListing(material) {
  return !isIndiaCountry(material?.country);
}

module.exports = {
  normalizeCountryCode,
  isIndiaCountry,
  isIndiaDomesticListing,
  isInternationallyVisible,
  isOutsideIndiaListing,
};
