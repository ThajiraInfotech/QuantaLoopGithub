const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../../data/india-cities.json");

let cache = null;

function normKey(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function loadDataset() {
  if (cache) return cache;
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  cache = JSON.parse(raw);
  return cache;
}

function isKnownStateCode(stateCode) {
  const dataset = loadDataset();
  return Boolean(stateCode && dataset.citiesByStateCode[stateCode]);
}

function getCitiesForState(stateCode) {
  const dataset = loadDataset();
  return dataset.citiesByStateCode[stateCode] ?? [];
}

function resolveAlias(stateCode, city) {
  const dataset = loadDataset();
  const aliases = dataset.aliasesByStateCode?.[stateCode] ?? {};
  const trimmed = city.trim();
  if (!trimmed) return null;

  if (aliases[trimmed]) return aliases[trimmed];

  const aliasKey = normKey(trimmed);
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (normKey(alias) === aliasKey) return canonical;
  }

  return null;
}

function resolveCity(stateCode, city) {
  if (!stateCode || !city?.trim()) return null;

  const alias = resolveAlias(stateCode, city);
  const candidate = alias ?? city.trim();
  const key = normKey(candidate);
  const match = getCitiesForState(stateCode).find((entry) => normKey(entry) === key);
  return match ?? null;
}

function searchCities(stateCode, query = "", limit = 30) {
  const cities = getCitiesForState(stateCode);
  if (!cities.length) {
    return { cities: [], total: 0, matched: 0 };
  }

  const q = normKey(query);
  const filtered = q
    ? cities.filter((city) => normKey(city).includes(q))
    : cities;

  const capped = filtered.slice(0, Math.max(1, Math.min(limit, 100)));

  return {
    total: cities.length,
    matched: filtered.length,
    cities: capped.map((name) => ({
      name,
      stateCode,
    })),
  };
}

function getDatasetMeta() {
  const dataset = loadDataset();
  return {
    version: dataset.version,
    source: dataset.source,
    generatedAt: dataset.generatedAt,
    totalCities: dataset.totalCities,
    stateCount: Object.keys(dataset.citiesByStateCode).length,
  };
}

module.exports = {
  loadDataset,
  isKnownStateCode,
  getCitiesForState,
  resolveCity,
  searchCities,
  getDatasetMeta,
};
