/**
 * Build backend/src/data/india-cities.json from dr5hn's open dataset.
 * Usage: node src/scripts/import-india-locations.js
 *
 * Source: https://github.com/dr5hn/countries-states-cities-database
 */
const fs = require("fs");
const https = require("https");
const path = require("path");

const OUTPUT = path.join(__dirname, "../data/india-cities.json");
const SOURCE_URL =
  "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json";

/** App state codes that differ from dr5hn ISO2 codes. */
const DR5HN_TO_APP_STATE_CODE = {
  CT: "CG",
  DH: "DN",
  OR: "OD",
  TG: "TS",
};

/** Legacy industrial / curated cities to keep for backward compatibility. */
const LEGACY_CITIES_BY_STATE = {
  AN: ["Port Blair"],
  AP: [
    "Visakhapatnam",
    "Vijayawada",
    "Tirupati",
    "Kakinada",
    "Nellore",
    "Guntur",
    "Rajahmundry",
    "Anantapur",
    "Kadapa",
    "Vizianagaram",
    "Srikakulam",
    "Eluru",
    "Ongole",
    "Chittoor",
  ],
  AR: ["Itanagar", "Pasighat", "Tawang", "Naharlagun", "Roing"],
  AS: [
    "Guwahati",
    "Dibrugarh",
    "Silchar",
    "Jorhat",
    "Tezpur",
    "Nagaon",
    "Tinsukia",
    "Bongaigaon",
    "Goalpara",
  ],
  BR: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
    "Purnia",
    "Bihar Sharif",
    "Begusarai",
    "Hajipur",
  ],
  CH: ["Chandigarh", "Mohali", "Panchkula"],
  CG: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur"],
  DN: ["Silvassa", "Daman", "Diu"],
  DL: ["New Delhi", "Delhi", "Narela", "Okhla", "Mayapuri", "Naraina", "Bawana"],
  GA: ["Panaji", "Margao", "Vasco da Gama", "Verna", "Mapusa", "Ponda"],
  GJ: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Ankleshwar",
    "Vapi",
    "Bharuch",
    "Morbi",
    "Junagadh",
    "Nadiad",
    "Kalol",
  ],
  HR: [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Karnal",
    "Rohtak",
    "Hisar",
    "Sonipat",
    "Manesar",
    "Bawal",
    "Rewari",
    "Yamunanagar",
  ],
  HP: ["Shimla", "Baddi", "Solan", "Mandi", "Parwanoo", "Nalagarh", "Una"],
  JK: ["Jammu", "Srinagar", "Baramulla", "Anantnag", "Udhampur", "Kathua"],
  JH: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Hazaribagh",
    "Giridih",
    "Ramgarh",
  ],
  KA: [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubballi",
    "Dharwad",
    "Belagavi",
    "Ballari",
    "Tumakuru",
    "Shivamogga",
    "Hosapete",
    "Bidar",
    "Raichur",
    "Hassan",
    "Udupi",
  ],
  KL: [
    "Kochi",
    "Thiruvananthapuram",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Alappuzha",
    "Palakkad",
    "Kannur",
    "Kottayam",
    "Malappuram",
    "Ernakulam",
  ],
  LA: ["Leh", "Kargil"],
  LD: ["Kavaratti"],
  MP: [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Ratlam",
    "Pithampur",
    "Mandideep",
    "Satna",
    "Rewa",
  ],
  MH: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Thane",
    "Navi Mumbai",
    "Kolhapur",
    "Solapur",
    "Jalgaon",
    "Amravati",
    "Chandrapur",
    "Ahmednagar",
    "Satara",
    "Ratnagiri",
    "Raigad",
    "Palghar",
  ],
  MN: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
  ML: ["Shillong", "Tura", "Jowai", "Nongstoin"],
  MZ: ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
  NL: ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
  OD: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Paradip",
    "Sambalpur",
    "Berhampur",
    "Balasore",
    "Angul",
    "Jharsuguda",
    "Puri",
  ],
  PY: ["Puducherry", "Karaikal", "Yanam", "Mahe"],
  PB: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Mohali",
    "Patiala",
    "Bathinda",
    "Hoshiarpur",
    "Pathankot",
    "Moga",
    "Phagwara",
  ],
  RJ: [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Bhiwadi",
    "Ajmer",
    "Bikaner",
    "Alwar",
    "Bhilwara",
    "Pali",
    "Sri Ganganagar",
  ],
  SK: ["Gangtok", "Rangpo", "Namchi", "Gyalshing"],
  TN: [
    "Chennai",
    "Coimbatore",
    "Hosur",
    "Tiruppur",
    "Salem",
    "Erode",
    "Tiruchirappalli",
    "Madurai",
    "Tirunelveli",
    "Thoothukudi",
    "Vellore",
    "Cuddalore",
    "Ranipet",
    "Sriperumbudur",
    "Ambattur",
    "Avadi",
    "Kanchipuram",
    "Thanjavur",
  ],
  TS: [
    "Hyderabad",
    "Warangal",
    "Karimnagar",
    "Nizamabad",
    "Khammam",
    "Ramagundam",
    "Secunderabad",
    "Sangareddy",
    "Patancheru",
    "Medak",
  ],
  TR: ["Agartala", "Udaipur", "Dharmanagar", "Ambassa"],
  UP: [
    "Lucknow",
    "Kanpur",
    "Noida",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Jhansi",
    "Mathura",
    "Firozabad",
    "Greater Noida",
  ],
  UK: [
    "Dehradun",
    "Haridwar",
    "Rudrapur",
    "Pantnagar",
    "Haldwani",
    "Kashipur",
    "Roorkee",
    "Sitarganj",
  ],
  WB: [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Siliguri",
    "Haldia",
    "Asansol",
    "Kharagpur",
    "Bardhaman",
    "Malda",
    "Raiganj",
    "Kalyani",
  ],
};

const ALIASES_BY_STATE = {
  TN: {
    Trichy: "Tiruchirappalli",
    Tuticorin: "Thoothukudi",
  },
  KA: {
    Bangalore: "Bengaluru",
    Mysore: "Mysuru",
    Mangalore: "Mangaluru",
  },
  KL: {
    Trivandrum: "Thiruvananthapuram",
    Calicut: "Kozhikode",
    Cochin: "Kochi",
  },
  TS: {
    Secunderabad: "Secunderabad",
  },
};

function downloadJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

function normKey(value) {
  return value.trim().toLowerCase();
}

function uniqueSorted(cities) {
  const seen = new Map();
  for (const city of cities) {
    const trimmed = city.trim();
    if (!trimmed) continue;
    const key = normKey(trimmed);
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

async function run() {
  process.stdout.write("Downloading dr5hn countries+states+cities.json…\n");
  const countries = await downloadJson(SOURCE_URL);
  const india = countries.find((entry) => entry.name === "India");
  if (!india) throw new Error("India not found in dr5hn dataset");

  const citiesByStateCode = {};

  for (const state of india.states) {
    const appCode = DR5HN_TO_APP_STATE_CODE[state.iso2] ?? state.iso2;
    const dr5hnCities = (state.cities ?? []).map((city) => city.name);
    const legacyCities = LEGACY_CITIES_BY_STATE[appCode] ?? [];
    citiesByStateCode[appCode] = uniqueSorted([...dr5hnCities, ...legacyCities]);
  }

  for (const [stateCode, cities] of Object.entries(LEGACY_CITIES_BY_STATE)) {
    if (!citiesByStateCode[stateCode]) {
      citiesByStateCode[stateCode] = uniqueSorted(cities);
    }
  }

  const payload = {
    version: 1,
    source: "dr5hn/countries-states-cities-database",
    generatedAt: new Date().toISOString(),
    totalCities: Object.values(citiesByStateCode).reduce(
      (sum, cities) => sum + cities.length,
      0,
    ),
    aliasesByStateCode: ALIASES_BY_STATE,
    citiesByStateCode,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload)}\n`, "utf8");

  process.stdout.write(`Wrote ${OUTPUT}\n`);
  process.stdout.write(`States: ${Object.keys(citiesByStateCode).length}\n`);
  process.stdout.write(`Cities: ${payload.totalCities}\n`);
}

run().catch((err) => {
  process.stderr.write(`Import failed: ${err.message}\n`);
  process.exit(1);
});
