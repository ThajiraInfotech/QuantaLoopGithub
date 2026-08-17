import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "messages", "partials");
const en = JSON.parse(
  fs.readFileSync(path.join(outDir, "legal.en.json"), "utf8")
);

const ADDR_HI =
  "ASM Fintech Private Limited, नया नं. 100, पुराना नं. 86, राघवन मार्ग, पेरम्बूर, Chennai – 600011, Tamil Nadu, India.";
const ADDR_TA =
  "ASM Fintech Private Limited, புதிய எண். 100, பழைய எண். 86, ராகவன் தெரு, பெரம்பூர், Chennai – 600011, Tamil Nadu, India.";

function deepTranslate(value, map, addr) {
  if (typeof value === "string") {
    if (value === "LEGAL_COMPANY_ADDRESS") return addr;
    return map[value] ?? value;
  }
  if (Array.isArray(value)) return value.map((v) => deepTranslate(v, map, addr));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepTranslate(v, map, addr);
    }
    return out;
  }
  return value;
}

function loadMap(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const hiMap = loadMap(path.join(__dirname, "legal-map.hi.json"));
const taMap = loadMap(path.join(__dirname, "legal-map.ta.json"));

const hi = deepTranslate(en, hiMap, ADDR_HI);
const ta = deepTranslate(en, taMap, ADDR_TA);

fs.writeFileSync(path.join(outDir, "legal.hi.json"), JSON.stringify(hi, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "legal.ta.json"), JSON.stringify(ta, null, 2) + "\n");

console.log("Wrote legal.hi.json and legal.ta.json");
