function userNeedsOnboarding(user) {
  if (!user || user.role === "admin") return false;

  const materialSignals = [
    ...(user.materialTypes ?? []),
    ...(user.preferredMaterialCategories ?? []),
    ...(user.requiredMaterialCategories ?? []),
  ].filter(Boolean);

  const hasMaterials = materialSignals.length > 0;
  const country = (user.country ?? "IN").toString().trim().toUpperCase();
  const isIndia = !country || country === "IN";

  let hasLocation = false;
  if (isIndia) {
    hasLocation =
      typeof user.state === "string" &&
      user.state.trim().length > 0 &&
      typeof (user.location ?? user.city) === "string" &&
      (user.location ?? user.city).trim().length > 0;
  } else {
    hasLocation = country.length >= 2;
  }

  return !hasMaterials || !hasLocation;
}

function isGoogleOnlyAccount(user) {
  if (user.hasLocalPassword === false) return true;
  return user.authProvider === "google" && user.hasLocalPassword !== true;
}

function userNeedsAccountSetup(user) {
  if (!user || user.role === "admin") return false;
  if (userNeedsOnboarding(user)) return false;
  return isGoogleOnlyAccount(user);
}

module.exports = { userNeedsOnboarding, userNeedsAccountSetup };
