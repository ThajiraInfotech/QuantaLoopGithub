import {
  getCitiesForStateCode,
  getCityPlaceholderForState,
} from "@/constants/indian-state-cities";

export const OTHER_REGION = "Other" as const;

export type StateLocationConfig = {
  code: string;
  name: string;
  regions: readonly string[];
  cityExamples: string;
};

const r = (...items: string[]) => [...items, OTHER_REGION] as const;

export const INDIAN_LOCATIONS: readonly StateLocationConfig[] = [
  {
    code: "AN",
    name: "Andaman & Nicobar Islands",
    regions: r("Port Blair Region"),
    cityExamples: "Port Blair",
  },
  {
    code: "AP",
    name: "Andhra Pradesh",
    regions: r(
      "Visakhapatnam Region",
      "Vijayawada Region",
      "Tirupati Region",
      "Kakinada Region",
    ),
    cityExamples: "Visakhapatnam, Vijayawada, Tirupati",
  },
  {
    code: "AR",
    name: "Arunachal Pradesh",
    regions: r("Itanagar Region", "Pasighat Region", "Tawang Region"),
    cityExamples: "Itanagar, Pasighat",
  },
  {
    code: "AS",
    name: "Assam",
    regions: r("Guwahati Region", "Dibrugarh Region", "Silchar Region", "Jorhat Region"),
    cityExamples: "Guwahati, Dibrugarh, Silchar",
  },
  {
    code: "BR",
    name: "Bihar",
    regions: r("Patna Region", "Gaya Region", "Muzaffarpur Region", "Bhagalpur Region"),
    cityExamples: "Patna, Gaya, Muzaffarpur",
  },
  {
    code: "CH",
    name: "Chandigarh",
    regions: r("Chandigarh Region", "Mohali Corridor"),
    cityExamples: "Chandigarh, Mohali",
  },
  {
    code: "CG",
    name: "Chhattisgarh",
    regions: r("Raipur Region", "Bhilai Region", "Bilaspur Region"),
    cityExamples: "Raipur, Bhilai, Bilaspur",
  },
  {
    code: "DN",
    name: "Dadra & Nagar Haveli and Daman & Diu",
    regions: r("Silvassa Region", "Daman Region", "Diu Region"),
    cityExamples: "Silvassa, Daman",
  },
  {
    code: "DL",
    name: "Delhi",
    regions: r("Delhi NCR Region", "Industrial Delhi Region"),
    cityExamples: "New Delhi, Noida, Gurgaon",
  },
  {
    code: "GA",
    name: "Goa",
    regions: r("North Goa Region", "South Goa Region", "Verna Industrial Region"),
    cityExamples: "Panaji, Margao, Verna",
  },
  {
    code: "GJ",
    name: "Gujarat",
    regions: r(
      "Ahmedabad Region",
      "Surat Region",
      "Vadodara Region",
      "Rajkot Region",
      "Bhavnagar Region",
    ),
    cityExamples: "Ahmedabad, Surat, Vadodara",
  },
  {
    code: "HR",
    name: "Haryana",
    regions: r("Gurugram Region", "Faridabad Region", "Panipat Region", "Ambala Region"),
    cityExamples: "Gurugram, Faridabad, Panipat",
  },
  {
    code: "HP",
    name: "Himachal Pradesh",
    regions: r("Shimla Region", "Baddi Region", "Solan Region", "Mandi Region"),
    cityExamples: "Shimla, Baddi, Solan",
  },
  {
    code: "JK",
    name: "Jammu & Kashmir",
    regions: r("Jammu Region", "Srinagar Region", "Baramulla Region"),
    cityExamples: "Jammu, Srinagar",
  },
  {
    code: "JH",
    name: "Jharkhand",
    regions: r("Ranchi Region", "Jamshedpur Region", "Dhanbad Region", "Bokaro Region"),
    cityExamples: "Ranchi, Jamshedpur, Dhanbad",
  },
  {
    code: "KA",
    name: "Karnataka",
    regions: r(
      "Bengaluru Region",
      "Mysuru Region",
      "Mangaluru Region",
      "Hubballi-Dharwad Region",
      "Belagavi Region",
    ),
    cityExamples: "Bengaluru, Mysuru, Mangaluru",
  },
  {
    code: "KL",
    name: "Kerala",
    regions: r(
      "Kochi Region",
      "Thiruvananthapuram Region",
      "Kozhikode Region",
      "Thrissur Region",
    ),
    cityExamples: "Kochi, Thiruvananthapuram, Kozhikode",
  },
  {
    code: "LA",
    name: "Ladakh",
    regions: r("Leh Region", "Kargil Region"),
    cityExamples: "Leh, Kargil",
  },
  {
    code: "LD",
    name: "Lakshadweep",
    regions: r("Kavaratti Region"),
    cityExamples: "Kavaratti",
  },
  {
    code: "MP",
    name: "Madhya Pradesh",
    regions: r(
      "Bhopal Region",
      "Indore Region",
      "Jabalpur Region",
      "Gwalior Region",
      "Pithampur Region",
    ),
    cityExamples: "Indore, Bhopal, Jabalpur",
  },
  {
    code: "MH",
    name: "Maharashtra",
    regions: r(
      "Mumbai Region",
      "Pune Region",
      "Nagpur Region",
      "Nashik Region",
      "Aurangabad Region",
    ),
    cityExamples: "Mumbai, Pune, Nagpur",
  },
  {
    code: "MN",
    name: "Manipur",
    regions: r("Imphal Region", "Thoubal Region"),
    cityExamples: "Imphal, Thoubal",
  },
  {
    code: "ML",
    name: "Meghalaya",
    regions: r("Shillong Region", "Tura Region"),
    cityExamples: "Shillong, Tura",
  },
  {
    code: "MZ",
    name: "Mizoram",
    regions: r("Aizawl Region", "Lunglei Region"),
    cityExamples: "Aizawl, Lunglei",
  },
  {
    code: "NL",
    name: "Nagaland",
    regions: r("Kohima Region", "Dimapur Region"),
    cityExamples: "Kohima, Dimapur",
  },
  {
    code: "OD",
    name: "Odisha",
    regions: r(
      "Bhubaneswar Region",
      "Cuttack Region",
      "Rourkela Region",
      "Paradip Region",
    ),
    cityExamples: "Bhubaneswar, Cuttack, Rourkela",
  },
  {
    code: "PY",
    name: "Puducherry",
    regions: r("Puducherry Region", "Karaikal Region"),
    cityExamples: "Puducherry, Karaikal",
  },
  {
    code: "PB",
    name: "Punjab",
    regions: r(
      "Ludhiana Region",
      "Amritsar Region",
      "Jalandhar Region",
      "Mohali Region",
    ),
    cityExamples: "Ludhiana, Amritsar, Mohali",
  },
  {
    code: "RJ",
    name: "Rajasthan",
    regions: r(
      "Jaipur Region",
      "Jodhpur Region",
      "Udaipur Region",
      "Kota Region",
      "Bhiwadi Region",
    ),
    cityExamples: "Jaipur, Jodhpur, Kota",
  },
  {
    code: "SK",
    name: "Sikkim",
    regions: r("Gangtok Region", "Rangpo Region"),
    cityExamples: "Gangtok, Rangpo",
  },
  {
    code: "TN",
    name: "Tamil Nadu",
    regions: r(
      "Chennai Region",
      "Coimbatore Region",
      "Hosur Region",
      "Tiruppur Region",
      "Salem Region",
      "Erode Region",
      "Trichy Region",
      "Madurai Region",
      "Tirunelveli Region",
      "Tuticorin Region",
      "Vellore Region",
      "Cuddalore Region",
    ),
    cityExamples: "Chennai, Coimbatore, Hosur",
  },
  {
    code: "TS",
    name: "Telangana",
    regions: r(
      "Hyderabad Region",
      "Warangal Region",
      "Karimnagar Region",
      "Nizamabad Region",
    ),
    cityExamples: "Hyderabad, Warangal, Karimnagar",
  },
  {
    code: "TR",
    name: "Tripura",
    regions: r("Agartala Region", "Udaipur Region"),
    cityExamples: "Agartala",
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    regions: r(
      "Noida Region",
      "Lucknow Region",
      "Kanpur Region",
      "Ghaziabad Region",
      "Agra Region",
      "Varanasi Region",
    ),
    cityExamples: "Noida, Lucknow, Kanpur",
  },
  {
    code: "UK",
    name: "Uttarakhand",
    regions: r(
      "Dehradun Region",
      "Haridwar Region",
      "Rudrapur Region",
      "Pantnagar Region",
    ),
    cityExamples: "Dehradun, Haridwar, Rudrapur",
  },
  {
    code: "WB",
    name: "West Bengal",
    regions: r(
      "Kolkata Region",
      "Howrah Region",
      "Durgapur Region",
      "Siliguri Region",
      "Haldia Region",
    ),
    cityExamples: "Kolkata, Howrah, Durgapur",
  },
] as const;

export const INDIAN_LOCATIONS_SORTED = [...INDIAN_LOCATIONS].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function getStateByCode(code: string): StateLocationConfig | undefined {
  return INDIAN_LOCATIONS.find((s) => s.code === code);
}

export function getRegionsForStateCode(code: string): readonly string[] {
  return getStateByCode(code)?.regions ?? [];
}

export function getCityPlaceholderForStateCode(code: string): string {
  return getCityPlaceholderForState(code);
}

export function getCitySuggestionsForStateCode(code: string): string[] {
  return getCitiesForStateCode(code);
}
