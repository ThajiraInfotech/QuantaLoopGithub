"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { Button } from "@/components/ui/button";
import { primaryActionLinkClassName } from "@/components/ui/link-styles";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { ROUTES } from "@/constants/routes";
import {
  fetchSavedMaterials,
  unsaveMaterialRequest,
} from "@/services/saved-materials/saved-material.service";
import { useSavedOpportunitiesStore } from "@/store/saved-opportunities-store";
import type { MaterialStatus } from "@/types/material";
import type { SavedMaterialRow } from "@/types/saved-material";

const MATERIAL_STATUSES = new Set<string>([
  "available",
  "active",
  "in_discussion",
  "fulfilled",
  "archived",
  "inactive",
]);

function asMaterialStatus(status: string): MaterialStatus {
  if (MATERIAL_STATUSES.has(status)) {
    return status as MaterialStatus;
  }
  return "archived";
}

export function SavedOpportunitiesPage() {
  const t = useTranslations("dashboard.saved");
  const { formatRelativeTime } = useLocalizedTime();
  const setStoreItems = useSavedOpportunitiesStore((s) => s.setItems);
  const [items, setItems] = useState<SavedMaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSavedMaterials();
      setItems(data);
      setStoreItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [setStoreItems, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeSaved(row: SavedMaterialRow) {
    setRemoveBusyId(row.id);
    try {
      await unsaveMaterialRequest(row.materialId);
      setItems((prev) => prev.filter((r) => r.id !== row.id));
      useSavedOpportunitiesStore.getState().removeByMaterialId(row.materialId);
      toast.success(t("removed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("removeError"));
    } finally {
      setRemoveBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-1 sm:py-8">
        {[0, 1].map((k) => (
          <div
            key={k}
            className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm leading-relaxed text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-8">
      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-zinc-600">
          {t("subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center sm:px-6 sm:py-12">
          <p className="text-sm font-medium text-zinc-800">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {t("emptyDescription")}
          </p>
          <Link
            href={ROUTES.materials}
            className={primaryActionLinkClassName(
              "mt-6 h-12 w-full text-base sm:h-10 sm:w-auto sm:text-small"
            )}
          >
            {t("browseMaterials")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <SavedMaterialCard
              key={row.id}
              row={row}
              removeBusy={removeBusyId === row.id}
              onRemove={() => void removeSaved(row)}
              formatRelativeTime={formatRelativeTime}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SavedMaterialCard({
  row,
  removeBusy,
  onRemove,
  formatRelativeTime,
}: {
  row: SavedMaterialRow;
  removeBusy: boolean;
  onRemove: () => void;
  formatRelativeTime: (iso: string) => string;
}) {
  const t = useTranslations("dashboard.saved");

  return (
    <li className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5">
      <div className="space-y-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-semibold text-pretty text-zinc-900">
            {row.title}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">{row.location}</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            {row.materialType} · {t("savedPrefix", { time: formatRelativeTime(row.createdAt) })}
          </p>
          <MaterialStatusBadge status={asMaterialStatus(row.status)} />
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:flex-wrap">
          <Link
            href={ROUTES.materialDetail(row.materialId)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:h-9 sm:min-h-0 sm:w-auto"
          >
            {t("openListing")}
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 w-full sm:h-9 sm:min-h-0 sm:w-auto"
            disabled={removeBusy}
            onClick={onRemove}
          >
            {removeBusy ? t("removing") : t("remove")}
          </Button>
        </div>
      </div>
    </li>
  );
}
