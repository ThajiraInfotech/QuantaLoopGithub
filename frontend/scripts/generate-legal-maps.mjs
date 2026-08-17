import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "messages", "partials", "legal.en.json"), "utf8")
);

function collectStrings(value, out) {
  if (typeof value === "string") {
    if (value !== "LEGAL_COMPANY_ADDRESS") out.add(value);
  } else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
}

const required = new Set();
collectStrings(en, required);

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "legal-translations-data.json"), "utf8")
);

const hi = {};
const ta = {};
for (const [enStr, { hi: hiStr, ta: taStr }] of Object.entries(data)) {
  hi[enStr] = hiStr;
  ta[enStr] = taStr;
}

const missing = [...required].filter((s) => !(s in hi)).sort();
if (missing.length) {
  fs.writeFileSync(path.join(__dirname, "_missing.json"), JSON.stringify(missing, null, 2));
  console.error("Missing translations:", missing.length);
  process.exit(1);
}

const extra = Object.keys(hi).filter((s) => !required.has(s));
if (extra.length) {
  console.error("Extra keys:", extra.length, extra);
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, "legal-map.hi.json"), JSON.stringify(hi, null, 2) + "\n");
fs.writeFileSync(path.join(__dirname, "legal-map.ta.json"), JSON.stringify(ta, null, 2) + "\n");
console.log("HI keys:", Object.keys(hi).length);
console.log("TA keys:", Object.keys(ta).length);
console.log("Required:", required.size);
console.log("Match:", Object.keys(hi).length === required.size && Object.keys(ta).length === required.size);
