"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MaterialCard } from "@/components/materials/material-card";
import { materialFieldClass } from "@/components/materials/material-form-styles";
import { ProviderMaterialCard } from "@/components/materials/provider-material-card";
import {
  buyerFiltersActive,
  countByInventoryBucket,
  filterBuyerMaterialsList,
  filterMaterialsByMarketTab,
  filterMaterialsList,
  interestCountByMaterial,
  MATERIALS_PAGE_SIZE,
  paginateList,
  pickRecommendedMaterials,
  RECOMMENDED_PREVIEW_SIZE,
  sortBuyerMaterials,
  sortProviderMaterials,
  uniqueMaterialFieldValues,
  type BuyerSortMode,
  type MaterialStatusFilter,
} from "@/components/materials/materials-inventory-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { primaryActionLinkClassName } from "@/components/ui/link-styles";
import { isIndiaCountry, normalizeCountryCode } from "@/constants/countries";
import { ROUTES } from "@/constants/routes";
import { canPublishMaterial } from "@/lib/auth/permissions";
import {
  buildMaterialMatchMetaMap,
  isMaterialFeedItem,
  type MaterialMatchMeta,
} from "@/lib/match-display";
import { cn } from "@/lib/utils";
import { fetchMatchSuggestions } from "@/services/matches/match.service";
import { fetchMyInterests } from "@/services/interests/interest.service";
import { fetchMaterials } from "@/services/materials/material.service";
import { fetchOpportunityFeed } from "@/services/opportunities/opportunity.service";
import {
  fetchSavedMaterials,
  saveMaterialRequest,
  unsaveMaterialRequest,
} from "@/services/saved-materials/saved-material.service";
import { useAuthStore } from "@/store/auth-store";
import { useMaterialStore } from "@/store/material-store";
import type { Interest } from "@/types/interest";
import type { AvailabilityFrequency } from "@/types/material";
import type { Material } from "@/types/material";

const AVAILABILITY_FREQUENCY_KEYS: Record<
  AvailabilityFrequency,
  "oneTime" | "daily" | "weekly" | "monthly"
> = {
  one_time: "oneTime",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

const AVAILABILITY_FILTER_OPTIONS = Object.keys(
  AVAILABILITY_FREQUENCY_KEYS
) as AvailabilityFrequency[];

function materialsForFeedSection(
  materials: Material[],
  feedSections: { id: string; items?: unknown[] }[],
  sectionId: string
): Material[] {
  const section = feedSections.find((s) => s.id === sectionId);
  const ids = new Set(
    section?.items?.filter(isMaterialFeedItem).map((item) => item.materialId) ?? []
  );
  if (!ids.size) return [];
  return materials.filter((m) => ids.has(m.id));
}

export default function MaterialsPage() {
  const t = useTranslations("materials.list");
  const tStatus = useTranslations("materials.status");
  const tAvail = useTranslations("materials.availability");
  const tCommon = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const items = useMaterialStore((s) => s.items);
  const setItems = useMaterialStore((s) => s.setItems);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [matchBlock, setMatchBlock] = useState<unknown>(null);
  const [feedSections, setFeedSections] = useState<{ id: string; items?: unknown[] }[]>(
    []
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saveBusyId, setSaveBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [buyerTypeFilter, setBuyerTypeFilter] = useState("");
  const [buyerLocationFilter, setBuyerLocationFilter] = useState("");
  const [buyerAvailabilityFilter, setBuyerAvailabilityFilter] = useState("");
  const [buyerSort, setBuyerSort] = useState<BuyerSortMode>("best_match");
  const [providerSort, setProviderSort] = useState<"newest" | "largest_quantity">(
    "newest"
  );
  const [page, setPage] = useState(1);
  const [recommendedExpanded, setRecommendedExpanded] = useState(false);
  const [marketTab, setMarketTab] = useState<"india" | "global">("india");

  const filterTabs = useMemo(
    () =>
      [
        { id: "all" as const, label: t("filterAll") },
        { id: "available" as const, label: t("filterAvailable") },
        { id: "in_discussion" as const, label: t("filterInDiscussion") },
        { id: "completed" as const, label: t("filterCompleted") },
      ] satisfies { id: MaterialStatusFilter; label: string }[],
    [t]
  );

  const buyerSortOptions = useMemo(
    () =>
      [
        { id: "newest" as const, label: t("sortNewest") },
        { id: "best_match" as const, label: t("sortBestMatch") },
        { id: "nearest" as const, label: t("sortNearest") },
        { id: "largest_quantity" as const, label: t("sortLargestQuantity") },
      ] satisfies { id: BuyerSortMode; label: string }[],
    [t]
  );

  const canPublish = canPublishMaterial(user);
  const buyerIsIndia = isIndiaCountry(normalizeCountryCode(user?.country));
  const buyerFilters = useMemo(
    () => ({
      search,
      materialType: buyerTypeFilter,
      location: buyerLocationFilter,
      availability: buyerAvailabilityFilter,
    }),
    [search, buyerTypeFilter, buyerLocationFilter, buyerAvailabilityFilter]
  );
  const filtersActive = buyerFiltersActive(buyerFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const role = useAuthStore.getState().user?.role;
      const isBuyer = role === "verified_buyer";

      const [mats, ...buyerExtras] = await Promise.all([
        fetchMaterials(),
        ...(isBuyer
          ? [
              fetchMatchSuggestions().catch(() => null),
              fetchOpportunityFeed().catch(() => []),
              fetchSavedMaterials().catch(() => []),
            ]
          : []),
      ]);

      setItems(mats);

      if (isBuyer) {
        const [match, desk, saved] = buyerExtras as [
          unknown,
          { id: string; items?: unknown[] }[],
          { materialId: string }[],
        ];
        setMatchBlock(match);
        setFeedSections(desk);
        setSavedIds(new Set(saved.map((s) => s.materialId)));
        setInterests([]);
      } else if (canPublishMaterial(useAuthStore.getState().user)) {
        const ints = await fetchMyInterests().catch(() => [] as Interest[]);
        setInterests(ints);
        setMatchBlock(null);
        setFeedSections([]);
        setSavedIds(new Set());
      } else {
        setInterests([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [setItems, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    buyerTypeFilter,
    buyerLocationFilter,
    buyerAvailabilityFilter,
    buyerSort,
    providerSort,
    canPublish,
  ]);

  const matchMeta = useMemo(
    () => buildMaterialMatchMetaMap(matchBlock, feedSections),
    [matchBlock, feedSections]
  );

  const fitScores = useMemo(() => {
    const scores = new Map<string, number>();
    for (const [id, meta] of matchMeta.entries()) {
      scores.set(id, meta.score);
    }
    return scores;
  }, [matchMeta]);

  const interestMap = useMemo(
    () => interestCountByMaterial(interests),
    [interests]
  );
  const buckets = useMemo(() => countByInventoryBucket(items), [items]);

  const recommendedMaterials = useMemo(() => {
    if (canPublish || filtersActive) return [];
    return pickRecommendedMaterials(items, fitScores);
  }, [canPublish, filtersActive, items, fitScores]);

  const otherStateMaterials = useMemo(() => {
    if (canPublish || filtersActive || !buyerIsIndia || marketTab === "global") {
      return [];
    }
    return materialsForFeedSection(items, feedSections, "materials_other_states");
  }, [canPublish, filtersActive, buyerIsIndia, marketTab, items, feedSections]);

  const globalMaterials = useMemo(() => {
    if (canPublish || filtersActive || !buyerIsIndia) return [];
    return materialsForFeedSection(items, feedSections, "materials_global");
  }, [canPublish, filtersActive, buyerIsIndia, items, feedSections]);

  const inCountryMaterials = useMemo(() => {
    if (canPublish || filtersActive || buyerIsIndia) return [];
    return materialsForFeedSection(
      items,
      feedSections,
      "materials_in_your_country"
    );
  }, [canPublish, filtersActive, buyerIsIndia, items, feedSections]);

  const nearYouMaterials = useMemo(() => {
    if (canPublish || filtersActive || !buyerIsIndia || marketTab === "global") {
      return [];
    }
    const fromFeed = materialsForFeedSection(
      items,
      feedSections,
      "materials_near_you"
    );
    return fromFeed.length > 0 ? fromFeed : recommendedMaterials;
  }, [
    canPublish,
    filtersActive,
    buyerIsIndia,
    marketTab,
    items,
    feedSections,
    recommendedMaterials,
  ]);

  const recommendedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of [
      ...recommendedMaterials,
      ...nearYouMaterials,
      ...otherStateMaterials,
      ...globalMaterials,
      ...inCountryMaterials,
    ]) {
      ids.add(m.id);
    }
    return ids;
  }, [
    recommendedMaterials,
    nearYouMaterials,
    otherStateMaterials,
    globalMaterials,
    inCountryMaterials,
  ]);

  const filteredItems = useMemo(() => {
    if (canPublish) {
      return sortProviderMaterials(
        filterMaterialsList(items, statusFilter, search),
        providerSort
      );
    }

    const marketScoped =
      buyerIsIndia ? filterMaterialsByMarketTab(items, marketTab) : items;
    const filtered = filterBuyerMaterialsList(marketScoped, buyerFilters);
    const allList = filtersActive
      ? filtered
      : filtered.filter((m) => !recommendedIds.has(m.id));

    return sortBuyerMaterials(
      allList,
      buyerSort,
      fitScores,
      user?.location ?? ""
    );
  }, [
    items,
    statusFilter,
    search,
    canPublish,
    buyerFilters,
    filtersActive,
    recommendedIds,
    buyerSort,
    fitScores,
    user?.location,
    providerSort,
    buyerIsIndia,
    marketTab,
  ]);

  const pagination = useMemo(
    () => paginateList(filteredItems, page, MATERIALS_PAGE_SIZE),
    [filteredItems, page]
  );

  const totalInterests = interests.length;
  const materialTypes = useMemo(
    () => uniqueMaterialFieldValues(items, "materialType"),
    [items]
  );
  const locations = useMemo(
    () => uniqueMaterialFieldValues(items, "location"),
    [items]
  );

  async function toggleSave(materialId: string, currentlySaved: boolean) {
    setSaveBusyId(materialId);
    try {
      if (currentlySaved) {
        await unsaveMaterialRequest(materialId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(materialId);
          return next;
        });
      } else {
        await saveMaterialRequest(materialId);
        setSavedIds((prev) => new Set(prev).add(materialId));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveListError"));
    } finally {
      setSaveBusyId(null);
    }
  }

  const headline = canPublish ? t("titleProvider") : t("titleBuyer");
  const subline = canPublish ? t("subtitleProvider") : t("subtitleBuyer");

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
            {headline}
          </h1>
          <p className="text-sm leading-relaxed text-pretty text-zinc-600">{subline}</p>
        </div>
        {canPublish ? (
          <Link
            href={ROUTES.materialsNew}
            className={primaryActionLinkClassName(
              "h-12 w-full text-base sm:h-10 sm:w-auto sm:text-small"
            )}
          >
            {t("publish")}
          </Link>
        ) : null}
      </div>

      {canPublish && !loading && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label={t("summaryAvailable")} value={buckets.available} />
          <SummaryTile label={t("summaryInDiscussion")} value={buckets.inDiscussion} />
          <SummaryTile label={t("summaryCompleted")} value={buckets.completed} />
          <SummaryTile
            label={t("summaryTotalInterests")}
            value={totalInterests}
            highlight={totalInterests > 0}
          />
        </div>
      ) : null}

      {canPublish && items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:py-1.5",
                  statusFilter === tab.id
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${materialFieldClass} w-full`}
              aria-label={t("searchAria")}
            />
            <BuyerFilterSelect
              label={tCommon("sortBy")}
              value={providerSort}
              onChange={(v) =>
                setProviderSort(v as "newest" | "largest_quantity")
              }
              options={["newest", "largest_quantity"]}
              formatOption={(v) =>
                v === "largest_quantity"
                  ? t("sortLargestQuantity")
                  : t("sortNewest")
              }
              showAllOption={false}
              className="sm:min-w-[180px]"
            />
          </div>
        </div>
      ) : null}

      {!canPublish && items.length > 0 ? (
        <div className="space-y-3">
          {buyerIsIndia ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMarketTab("india");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:py-1.5",
                  marketTab === "india"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                )}
              >
                India
              </button>
              <button
                type="button"
                onClick={() => {
                  setMarketTab("global");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:py-1.5",
                  marketTab === "global"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                )}
              >
                Global
              </button>
            </div>
          ) : null}
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${materialFieldClass} w-full`}
            aria-label={t("searchAria")}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BuyerFilterSelect
              label={t("materialType")}
              value={buyerTypeFilter}
              onChange={setBuyerTypeFilter}
              options={materialTypes}
            />
            <BuyerFilterSelect
              label={t("location")}
              value={buyerLocationFilter}
              onChange={setBuyerLocationFilter}
              options={locations}
            />
            <BuyerFilterSelect
              label={t("availability")}
              value={buyerAvailabilityFilter}
              onChange={setBuyerAvailabilityFilter}
              options={AVAILABILITY_FILTER_OPTIONS}
              formatOption={(v) =>
                tAvail(
                  AVAILABILITY_FREQUENCY_KEYS[v as AvailabilityFrequency]
                )
              }
            />
            <BuyerFilterSelect
              label={tCommon("sortBy")}
              value={buyerSort}
              onChange={(v) => setBuyerSort(v as BuyerSortMode)}
              options={buyerSortOptions.map((o) => o.id)}
              formatOption={(v) =>
                buyerSortOptions.find((o) => o.id === v)?.label ?? v
              }
              showAllOption={false}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 min-h-11 w-full sm:w-auto"
            onClick={() => void load()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              className="h-32 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100/80"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">
            {canPublish ? t("emptyProvider") : t("emptyBuyer")}
          </p>
          {canPublish ? (
            <Link
              href={ROUTES.materialsNew}
              className={primaryActionLinkClassName(
                "mt-6 h-12 w-full text-base sm:h-10 sm:w-auto sm:text-small"
              )}
            >
              {t("publish")}
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {!canPublish && nearYouMaterials.length > 0 ? (
            <RecommendedMaterialsSection
              title={t("recommendedNearYou")}
              description="Same material category in your state."
              materials={nearYouMaterials}
              expanded={recommendedExpanded}
              onToggleExpanded={() => setRecommendedExpanded((o) => !o)}
              matchMeta={matchMeta}
              savedIds={savedIds}
              saveBusyId={saveBusyId}
              onToggleSave={toggleSave}
            />
          ) : null}

          {!canPublish && otherStateMaterials.length > 0 ? (
            <RecommendedMaterialsSection
              title={t("recommendedOtherStates")}
              description="Same material category — material is located in a different state from yours."
              materials={otherStateMaterials}
              expanded={recommendedExpanded}
              onToggleExpanded={() => setRecommendedExpanded((o) => !o)}
              matchMeta={matchMeta}
              savedIds={savedIds}
              saveBusyId={saveBusyId}
              onToggleSave={toggleSave}
            />
          ) : null}

          {!canPublish &&
          buyerIsIndia &&
          marketTab === "global" &&
          globalMaterials.length > 0 ? (
            <RecommendedMaterialsSection
              title={t("recommendedGlobal")}
              description="Materials listed outside India."
              materials={globalMaterials}
              expanded={recommendedExpanded}
              onToggleExpanded={() => setRecommendedExpanded((o) => !o)}
              matchMeta={matchMeta}
              savedIds={savedIds}
              saveBusyId={saveBusyId}
              onToggleSave={toggleSave}
            />
          ) : null}

          {!canPublish && inCountryMaterials.length > 0 ? (
            <RecommendedMaterialsSection
              title={t("recommendedInCountry")}
              description="Same material category in your country."
              materials={inCountryMaterials}
              expanded={recommendedExpanded}
              onToggleExpanded={() => setRecommendedExpanded((o) => !o)}
              matchMeta={matchMeta}
              savedIds={savedIds}
              saveBusyId={saveBusyId}
              onToggleSave={toggleSave}
            />
          ) : null}

          {!canPublish &&
          nearYouMaterials.length === 0 &&
          otherStateMaterials.length === 0 &&
          globalMaterials.length === 0 &&
          inCountryMaterials.length === 0 &&
          recommendedMaterials.length > 0 ? (
            <RecommendedMaterialsSection
              title="Recommended for you"
              description="Ranked by material category and location fit."
              materials={recommendedMaterials}
              expanded={recommendedExpanded}
              onToggleExpanded={() => setRecommendedExpanded((o) => !o)}
              matchMeta={matchMeta}
              savedIds={savedIds}
              saveBusyId={saveBusyId}
              onToggleSave={toggleSave}
            />
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                {t("allListings")}
              </h2>
              {!canPublish ? (
                <span className="text-xs text-zinc-500">
                  {filteredItems.length} listing
                  {filteredItems.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("emptyFiltered")}</p>
            ) : (
              <>
                <p className="text-xs text-zinc-500">
                  {t("showingRange", {
                    start: pagination.rangeStart,
                    end: pagination.rangeEnd,
                    total: pagination.total,
                  })}
                </p>
                <ul className="space-y-4">
                  {pagination.items.map((m) => (
                    <li key={m.id}>
                      {canPublish ? (
                        <ProviderMaterialCard
                          material={m}
                          interestCount={interestMap.get(m.id) ?? 0}
                          onUpdated={() => void load()}
                        />
                      ) : (
                        <BuyerMaterialCardItem
                          material={m}
                          fitScore={matchMeta.get(m.id)?.score ?? null}
                          matchLabel={matchMeta.get(m.id)?.matchLabel}
                          locationScope={matchMeta.get(m.id)?.locationScope}
                          locationNote={matchMeta.get(m.id)?.locationNote}
                          saved={savedIds.has(m.id)}
                          saveBusy={saveBusyId === m.id}
                          onToggleSave={toggleSave}
                        />
                      )}
                    </li>
                  ))}
                </ul>
                <PaginationBar
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function RecommendedMaterialsSection({
  title,
  description,
  materials,
  expanded,
  onToggleExpanded,
  matchMeta,
  savedIds,
  saveBusyId,
  onToggleSave,
}: {
  title: string;
  description: string;
  materials: Material[];
  expanded: boolean;
  onToggleExpanded: () => void;
  matchMeta: Map<string, MaterialMatchMeta>;
  savedIds: Set<string>;
  saveBusyId: string | null;
  onToggleSave: (materialId: string, currentlySaved: boolean) => void;
}) {
  const visible = expanded
    ? materials
    : materials.slice(0, RECOMMENDED_PREVIEW_SIZE);

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-zinc-900">
          {title} ({materials.length} match{materials.length === 1 ? "" : "es"})
        </h2>
        <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <ul className="space-y-4">
        {visible.map((m) => {
          const meta = matchMeta.get(m.id);
          return (
            <li key={`rec-${title}-${m.id}`}>
              <BuyerMaterialCardItem
                material={m}
                fitScore={meta?.score ?? null}
                matchLabel={meta?.matchLabel}
                locationScope={meta?.locationScope}
                locationNote={meta?.locationNote}
                saved={savedIds.has(m.id)}
                saveBusy={saveBusyId === m.id}
                onToggleSave={onToggleSave}
              />
            </li>
          );
        })}
      </ul>
      {materials.length > RECOMMENDED_PREVIEW_SIZE ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="min-h-11 text-sm font-medium text-zinc-800 underline-offset-4 hover:underline"
        >
          {expanded
            ? "Show fewer matches"
            : `View all ${materials.length} matches →`}
        </button>
      ) : null}
    </section>
  );
}

function BuyerMaterialCardItem({
  material,
  fitScore,
  matchLabel,
  locationScope,
  locationNote,
  saved,
  saveBusy,
  onToggleSave,
}: {
  material: Material;
  fitScore: number | null;
  matchLabel?: string;
  locationScope?: MaterialMatchMeta["locationScope"];
  locationNote?: string;
  saved: boolean;
  saveBusy: boolean;
  onToggleSave: (materialId: string, currentlySaved: boolean) => void;
}) {
  return (
    <MaterialCard
      material={material}
      fitScore={fitScore}
      matchLabel={matchLabel}
      locationScope={locationScope}
      locationNote={locationNote}
      saved={saved}
      saveBusy={saveBusy}
      onToggleSave={onToggleSave}
    />
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("materials.list");

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
      aria-label="Materials pagination"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 sm:h-9 sm:min-h-0"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t("previous")}
      </Button>
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis ? (
              <span className="px-1 text-sm text-zinc-400">…</span>
            ) : null}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors sm:h-9 sm:min-w-9",
                p === page
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {p}
            </button>
          </span>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 sm:h-9 sm:min-h-0"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t("next")}
      </Button>
    </nav>
  );
}

function BuyerFilterSelect({
  label,
  value,
  onChange,
  options,
  formatOption,
  showAllOption = true,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  formatOption?: (value: string) => string;
  showAllOption?: boolean;
  className?: string;
}) {
  const tCommon = useTranslations("common");

  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-12 w-full rounded-md border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-10 sm:text-sm"
      >
        {showAllOption ? (
          <option value="">{tCommon("all")}</option>
        ) : null}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatOption ? formatOption(opt) : opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm shadow-zinc-950/5",
        highlight
          ? "border-emerald-300/90 bg-emerald-50/70"
          : "border-zinc-200/80 bg-white"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          highlight ? "text-emerald-900" : "text-zinc-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}
