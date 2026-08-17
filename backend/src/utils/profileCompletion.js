function hasText(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function computeProfileCompletion(doc) {
  let score = 0;
  if (hasText(doc.companyDescription)) score += 22;
  if (hasText(doc.website)) score += 12;
  if ((doc.industriesHandled ?? []).filter(Boolean).length) score += 18;

  const materialSignals = [
    ...(doc.materialTypes ?? []),
    ...(doc.preferredMaterialCategories ?? []),
    ...(doc.requiredMaterialCategories ?? []),
  ].filter(Boolean);
  if (materialSignals.length) score += 18;

  const hasStructuredLocation =
    hasText(doc.state) && (hasText(doc.location) || hasText(doc.city));
  const country = (doc.country ?? "IN").toString().trim().toUpperCase();
  const hasAbroadCountry = country && country !== "IN";
  if (
    hasStructuredLocation ||
    hasAbroadCountry ||
    hasText(doc.operationalLocation)
  ) {
    score += 15;
  }
  if (hasText(doc.employeeRange)) score += 5;
  if (doc.establishedYear && Number(doc.establishedYear) > 1800) score += 5;
  if (typeof doc.responseRate === "number" && doc.responseRate >= 0) score += 5;
  return Math.min(100, Math.round(score));
}

module.exports = { computeProfileCompletion };
