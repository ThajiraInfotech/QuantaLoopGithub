import type { Interest, InterestStatus } from "@/types/interest";
import type { Material, MaterialStatus } from "@/types/material";
import { isIndiaCountry, normalizeCountryCode } from "@/constants/countries";

const COMPLETED_STATUSES: MaterialStatus[] = [
  "fulfilled",
  "archived",
  "inactive",
];

const ACTIONABLE_INTEREST_STATUSES: InterestStatus[] = [
  "pending",
  "accepted",
  "discussion",
  "pickup_scheduled",
];

export function isCompletedMaterial(status: MaterialStatus): boolean {
  return COMPLETED_STATUSES.includes(status);
}

export function isActionableInterest(interest: Interest): boolean {
  return ACTIONABLE_INTEREST_STATUSES.includes(interest.status);
}

export type MaterialStatusFilter =
  | "all"
  | "available"
  | "in_discussion"
  | "completed";

export function interestCountByMaterial(interests: Interest[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const i of interests) {
    map.set(i.materialId, (map.get(i.materialId) ?? 0) + 1);
  }
  return map;
}

export function actionableInterestCountByMaterial(
  interests: Interest[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const interest of interests) {
    if (!isActionableInterest(interest)) continue;
    map.set(
      interest.materialId,
      (map.get(interest.materialId) ?? 0) + 1
    );
  }
  return map;
}

export function countActionableInterests(interests: Interest[]): number {
  return interests.filter(isActionableInterest).length;
}

export function matchesStatusFilter(
  status: MaterialStatus,
  filter: MaterialStatusFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "available") {
    return status === "available" || status === "active";
  }
  if (filter === "in_discussion") return status === "in_discussion";
  if (filter === "completed") {
    return status === "fulfilled" || status === "archived" || status === "inactive";
  }
  return true;
}

export function countByInventoryBucket(materials: Material[]) {
  let available = 0;
  let inDiscussion = 0;
  let completed = 0;
  for (const m of materials) {
    if (m.status === "available" || m.status === "active") available += 1;
    else if (m.status === "in_discussion") inDiscussion += 1;
    else if (
      m.status === "fulfilled" ||
      m.status === "archived" ||
      m.status === "inactive"
    ) {
      completed += 1;
    }
  }
  return { available, inDiscussion, completed };
}

export function filterMaterialsList(
  materials: Material[],
  filter: MaterialStatusFilter,
  search: string
): Material[] {
  const q = search.trim().toLowerCase();
  return materials.filter((m) => {
    if (!matchesStatusFilter(m.status, filter)) return false;
    if (!q) return true;
    const hay = `${m.title} ${m.materialType} ${m.location}`.toLowerCase();
    return hay.includes(q);
  });
}

export type BuyerMaterialFilters = {
  search: string;
  materialType: string;
  location: string;
  availability: string;
};

export function filterBuyerMaterialsList(
  materials: Material[],
  filters: BuyerMaterialFilters
): Material[] {
  const q = filters.search.trim().toLowerCase();
  return materials.filter((m) => {
    if (filters.materialType && m.materialType !== filters.materialType) {
      return false;
    }
    if (filters.location && m.location !== filters.location) {
      return false;
    }
    if (
      filters.availability &&
      m.availabilityFrequency !== filters.availability
    ) {
      return false;
    }
    if (!q) return true;
    const hay =
      `${m.title} ${m.materialType} ${m.location} ${m.provider.companyName}`.toLowerCase();
    return hay.includes(q);
  });
}

export function uniqueMaterialFieldValues(
  materials: Material[],
  field: "materialType" | "location"
): string[] {
  const values = new Set<string>();
  for (const m of materials) {
    const v = field === "materialType" ? m.materialType : m.location;
    if (v?.trim()) values.add(v.trim());
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export const MATERIALS_PAGE_SIZE = 20;

export type BuyerSortMode =
  | "newest"
  | "best_match"
  | "nearest"
  | "largest_quantity";

export type PaginatedList<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginateList<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedList<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}

function normLocation(s: string): string {
  return s.trim().toLowerCase();
}

export function locationProximityScore(
  materialLocation: string,
  buyerLocation: string
): number {
  const a = normLocation(materialLocation);
  const b = normLocation(buyerLocation);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  const cityA = a.split(",")[0]?.trim();
  const cityB = b.split(",")[0]?.trim();
  if (cityA && cityB && (cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA))) {
    return 60;
  }
  return 0;
}

export function sortBuyerMaterials(
  materials: Material[],
  sort: BuyerSortMode,
  fitScores: Map<string, number>,
  buyerLocation: string
): Material[] {
  const sorted = [...materials];
  sorted.sort((a, b) => {
    if (sort === "best_match") {
      return (fitScores.get(b.id) ?? 0) - (fitScores.get(a.id) ?? 0);
    }
    if (sort === "nearest") {
      return (
        locationProximityScore(b.location, buyerLocation) -
        locationProximityScore(a.location, buyerLocation)
      );
    }
    if (sort === "largest_quantity") {
      return b.quantity - a.quantity;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return sorted;
}

export function sortProviderMaterials(
  materials: Material[],
  sort: "newest" | "largest_quantity"
): Material[] {
  const sorted = [...materials];
  sorted.sort((a, b) => {
    if (sort === "largest_quantity") {
      return b.quantity - a.quantity;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return sorted;
}

export function buyerFiltersActive(filters: BuyerMaterialFilters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.materialType ||
      filters.location ||
      filters.availability
  );
}

export const RECOMMENDED_SECTION_SIZE = 6;
export const RECOMMENDED_PREVIEW_SIZE = 3;

export function pickRecommendedMaterials(
  materials: Material[],
  fitScores: Map<string, number>,
  limit = RECOMMENDED_SECTION_SIZE
): Material[] {
  return [...materials]
    .filter((m) => (fitScores.get(m.id) ?? 0) >= 20)
    .sort((a, b) => (fitScores.get(b.id) ?? 0) - (fitScores.get(a.id) ?? 0))
    .slice(0, limit);
}

export function isOutsideIndiaMaterial(material: Material): boolean {
  return !isIndiaCountry(material.country);
}

export function filterMaterialsByMarketTab(
  materials: Material[],
  tab: "india" | "global"
): Material[] {
  if (tab === "global") {
    return materials.filter(isOutsideIndiaMaterial);
  }
  return materials.filter((m) => !isOutsideIndiaMaterial(m));
}

export function materialCountryCode(material: Material): string {
  return normalizeCountryCode(material.country);
}
