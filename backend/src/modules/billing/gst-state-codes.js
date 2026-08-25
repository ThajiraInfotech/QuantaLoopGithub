/**
 * Maps Quanta Loop location state codes (e.g. TN) to GST numeric codes (e.g. 33).
 * Place of supply / GSTIN prefix use the numeric code.
 */
const GST_STATE_BY_APP_CODE = Object.freeze({
  AN: "35",
  AP: "37",
  AR: "12",
  AS: "18",
  BR: "10",
  CH: "04",
  CT: "22",
  CG: "22",
  DN: "26",
  DD: "26",
  DL: "07",
  GA: "30",
  GJ: "24",
  HR: "06",
  HP: "02",
  JK: "01",
  JH: "20",
  KA: "29",
  KL: "32",
  LA: "38",
  LD: "31",
  MP: "23",
  MH: "27",
  MN: "14",
  ML: "17",
  MZ: "15",
  NL: "13",
  OR: "21",
  OD: "21",
  PY: "34",
  PB: "03",
  RJ: "08",
  SK: "11",
  TN: "33",
  TS: "36",
  TG: "36",
  TR: "16",
  UP: "09",
  UK: "05",
  UT: "05",
  WB: "19",
});

function normalizeAppStateCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function toGstStateCode(appStateCode) {
  const code = normalizeAppStateCode(appStateCode);
  if (/^\d{2}$/.test(code)) return code;
  return GST_STATE_BY_APP_CODE[code] || null;
}

module.exports = {
  GST_STATE_BY_APP_CODE,
  normalizeAppStateCode,
  toGstStateCode,
};
