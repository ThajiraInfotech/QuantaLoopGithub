import type { MaterialCategoryGroup } from "@/constants/material-categories";
import { MATERIAL_CATEGORY_GROUPS } from "@/constants/material-categories";

export type MaterialSubtypeSection = {
  label: string;
  items: readonly string[];
};

export type MaterialCategoryTaxonomy = {
  category: MaterialCategoryGroup;
  sections: readonly MaterialSubtypeSection[];
};

export const MATERIAL_CATEGORY_TAXONOMY: readonly MaterialCategoryTaxonomy[] = [
  {
    category: "Plastic Waste",
    sections: [
      {
        label: "Thermoplastics",
        items: [
          "PET",
          "HDPE",
          "LDPE",
          "LLDPE",
          "PP",
          "PVC",
          "PS",
          "ABS",
          "Nylon (PA)",
          "Polycarbonate (PC)",
          "POM",
          "PMMA",
          "EVA",
          "TPU",
          "TPE",
          "Mixed Plastics",
        ],
      },
      {
        label: "Thermosets",
        items: ["Epoxy", "Phenolic", "Melamine", "Polyester Resin Scrap"],
      },
      {
        label: "Forms",
        items: [
          "Shavings",
          "Regrind",
          "Flakes",
          "Pellets",
          "Lumps",
          "Film Scrap",
          "Purge",
          "Dust",
        ],
      },
    ],
  },
  {
    category: "Paper & Cardboard Waste",
    sections: [
      {
        label: "Types",
        items: [
          "OCC (Old Corrugated Containers)",
          "Corrugated Cardboard",
          "Newspaper",
          "Office Paper",
          "White Paper",
          "Mixed Paper",
          "Kraft Paper",
          "Duplex Board",
          "Cartons",
          "Paper Tubes",
          "Tissue Waste",
          "Paper Mill Waste",
        ],
      },
      {
        label: "Forms",
        items: ["Baled", "Loose", "Shredded"],
      },
    ],
  },
  {
    category: "Metal Waste",
    sections: [
      {
        label: "Ferrous",
        items: ["Mild Steel", "Stainless Steel", "Cast Iron", "Tool Steel"],
      },
      {
        label: "Non-Ferrous",
        items: ["Aluminum", "Copper", "Brass", "Zinc", "Lead", "Nickel", "Titanium"],
      },
      {
        label: "Forms",
        items: [
          "Turnings",
          "Borings",
          "Shavings",
          "Sheets",
          "Pipes",
          "Wires",
          "Punchings",
          "Castings",
        ],
      },
    ],
  },
  {
    category: "E-Waste",
    sections: [
      {
        label: "IT Equipment",
        items: ["Computers", "Laptops", "Servers", "Networking Equipment"],
      },
      {
        label: "Consumer Electronics",
        items: ["Mobile Phones", "TVs", "Monitors", "Printers"],
      },
      {
        label: "Components",
        items: ["PCB Boards", "IC Components", "Transformers", "Power Supplies"],
      },
      {
        label: "Accessories",
        items: ["Cables", "Chargers", "Connectors"],
      },
    ],
  },
  {
    category: "Glass Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Clear Glass",
          "Green Glass",
          "Amber Glass",
          "Mixed Glass",
          "Tempered Glass",
          "Laminated Glass",
          "Solar Glass",
        ],
      },
    ],
  },
  {
    category: "Rubber Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Tyres",
          "Conveyor Belts",
          "Rubber Sheets",
          "EPDM",
          "Nitrile Rubber",
          "Silicone Rubber",
          "Natural Rubber",
          "Crumb Rubber",
        ],
      },
    ],
  },
  {
    category: "Textile Waste",
    sections: [
      {
        label: "Natural Fibers",
        items: ["Cotton", "Wool", "Silk", "Jute"],
      },
      {
        label: "Synthetic Fibers",
        items: ["Polyester", "Nylon", "Acrylic", "Spandex"],
      },
      {
        label: "Industrial Textile Waste",
        items: ["Yarn Waste", "Fabric Rolls", "Garment Cuttings"],
      },
    ],
  },
  {
    category: "Wood Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Pallets",
          "Timber Offcuts",
          "Plywood",
          "MDF",
          "Particle Board",
          "Sawdust",
          "Wood Chips",
          "Furniture Scrap",
          "Packaging Wood",
        ],
      },
    ],
  },
  {
    category: "Organic/Biodegradable Waste",
    sections: [
      {
        label: "Food Waste",
        items: ["Fruits", "Vegetables", "Bakery Waste", "Dairy Waste"],
      },
      {
        label: "Agricultural Waste",
        items: ["Crop Residue", "Husk", "Straw", "Bagasse"],
      },
      {
        label: "Other",
        items: ["Garden Waste", "Animal Waste", "Compostable Waste"],
      },
    ],
  },
  {
    category: "Construction & Demolition Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Concrete",
          "Bricks",
          "Tiles",
          "Asphalt",
          "Sand",
          "Soil",
          "Stone",
          "Gypsum Board",
          "Mixed C&D Waste",
        ],
      },
    ],
  },
  {
    category: "Chemical Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Solvents",
          "Paint Waste",
          "Ink Waste",
          "Resin Waste",
          "Adhesive Waste",
          "Acids",
          "Alkalis",
          "Laboratory Chemicals",
        ],
      },
    ],
  },
  {
    category: "Battery Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Lead Acid",
          "Lithium Ion",
          "NiMH",
          "NiCd",
          "Industrial Batteries",
          "EV Batteries",
        ],
      },
    ],
  },
  {
    category: "Industrial By-products",
    sections: [
      {
        label: "Types",
        items: [
          "Fly Ash",
          "Bottom Ash",
          "Slag",
          "Foundry Sand",
          "Lime Sludge",
          "Red Mud",
          "Gypsum",
          "Metal Oxides",
        ],
      },
    ],
  },
  {
    category: "Hazardous Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Contaminated Containers",
          "Paint Sludge",
          "Chemical Sludge",
          "Used Filters",
          "Contaminated Rags",
          "Hazardous Packaging",
          "Toxic Residues",
        ],
      },
    ],
  },
  {
    category: "Leather & Footwear Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Leather Cuttings",
          "Finished Leather Scrap",
          "Synthetic Leather",
          "PU Leather",
          "Shoe Manufacturing Scrap",
          "Footwear Rejects",
        ],
      },
    ],
  },
  {
    category: "Pharmaceutical & Biomedical Waste",
    sections: [
      {
        label: "Pharmaceutical",
        items: [
          "Expired Medicines",
          "API Waste",
          "Packaging Waste",
          "Batch Rejects",
        ],
      },
      {
        label: "Biomedical",
        items: ["Sharps", "Syringes", "Gloves", "PPE", "Laboratory Waste"],
      },
    ],
  },
  {
    category: "Oil & Petrochemical Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Used Lubricating Oil",
          "Hydraulic Oil",
          "Cutting Oil",
          "Grease Waste",
          "Oil Sludge",
          "Refinery Residue",
          "Wax Waste",
          "Fuel Contaminated Waste",
        ],
      },
    ],
  },
  {
    category: "Composite & Multi-layer Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Tetra Packs",
          "Flexible Packaging",
          "Laminates",
          "FRP Scrap",
          "Carbon Fiber Scrap",
          "Fiberglass Scrap",
          "Mixed Material Packaging",
        ],
      },
    ],
  },
  {
    category: "Mining & Mineral Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Tailings",
          "Overburden",
          "Mineral Slurry",
          "Rock Waste",
          "Quarry Waste",
          "Coal Rejects",
          "Stone Dust",
        ],
      },
    ],
  },
  {
    category: "Wastewater & Sludge",
    sections: [
      {
        label: "Types",
        items: [
          "ETP Sludge",
          "STP Sludge",
          "Industrial Sludge",
          "Oily Sludge",
          "Paper Mill Sludge",
          "Chemical Sludge",
          "Dewatered Cake",
        ],
      },
    ],
  },
  {
    category: "Gas & Emission Control Waste",
    sections: [
      {
        label: "Types",
        items: [
          "Activated Carbon",
          "Spent Catalyst",
          "Scrubber Residue",
          "Filter Dust",
          "Baghouse Dust",
          "Furnace Dust",
          "Carbon Capture Residue",
        ],
      },
    ],
  },
  {
    category: "Others",
    sections: [],
  },
] as const;

const TAXONOMY_BY_CATEGORY = new Map(
  MATERIAL_CATEGORY_TAXONOMY.map((entry) => [entry.category, entry])
);

export function getCategoryTaxonomy(
  category: string
): MaterialCategoryTaxonomy | undefined {
  const normalized = MATERIAL_CATEGORY_GROUPS.find(
    (item) => item.toLowerCase() === category.trim().toLowerCase()
  );
  return normalized ? TAXONOMY_BY_CATEGORY.get(normalized) : undefined;
}

export function getSubtypesForCategory(category: string): string[] {
  const taxonomy = getCategoryTaxonomy(category);
  if (!taxonomy) return [];
  return taxonomy.sections.flatMap((section) => [...section.items]);
}

/** Select sentinel for custom material names; never persist this value. */
export const MATERIAL_SUBTYPE_OTHER = "__other__";

export function isValidSubtypeForCategory(
  category: string,
  subtype: string
): boolean {
  const key = subtype.trim().toLowerCase();
  if (!key) return false;
  return getSubtypesForCategory(category).some(
    (item) => item.toLowerCase() === key
  );
}

/** Reject bare "Other"/"Others" as the stored material name. */
export function isOtherSubtypeLabelOnly(subtype: string): boolean {
  const key = subtype.trim().toLowerCase();
  return key === "other" || key === "others";
}

export function resolveSubtypeForCategory(
  category: string,
  value: string
): string {
  const key = value.trim().toLowerCase();
  if (!key) return "";
  return (
    getSubtypesForCategory(category).find(
      (item) => item.toLowerCase() === key
    ) ?? value.trim()
  );
}
