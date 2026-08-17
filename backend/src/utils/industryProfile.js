/** Sync primary / secondary / custom industry fields and legacy industriesHandled */
function buildIndustriesHandled(primary, secondaryIndustries, customIndustry) {
  const seen = new Set();
  const result = [];
  for (const label of [
    primary,
    ...(secondaryIndustries ?? []),
    customIndustry,
  ]) {
    const trimmed = typeof label === "string" ? label.trim() : "";
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.slice(0, 40);
}

function applyIndustryProfilePatch(user, data) {
  const primary =
    data.primaryIndustry !== undefined
      ? String(data.primaryIndustry).trim()
      : data.industryType !== undefined
        ? String(data.industryType).trim()
        : undefined;

  if (primary !== undefined) {
    user.industryType = primary;
  }
  if (data.secondaryIndustries !== undefined) {
    user.secondaryIndustries = data.secondaryIndustries;
  }
  if (data.customIndustry !== undefined) {
    user.customIndustry = String(data.customIndustry).trim();
  }

  const shouldSyncHandled =
    primary !== undefined ||
    data.secondaryIndustries !== undefined ||
    data.customIndustry !== undefined ||
    data.industriesHandled === undefined;

  if (shouldSyncHandled) {
    user.industriesHandled = buildIndustriesHandled(
      user.industryType,
      user.secondaryIndustries,
      user.customIndustry
    );
  } else if (data.industriesHandled !== undefined) {
    user.industriesHandled = data.industriesHandled;
  }
}

module.exports = { applyIndustryProfilePatch, buildIndustriesHandled };
