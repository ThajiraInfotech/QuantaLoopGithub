"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { isCompletedMaterial } from "@/components/materials/materials-inventory-utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { cn } from "@/lib/utils";
import { deleteMaterial } from "@/services/materials/material.service";
import { useMaterialStore } from "@/store/material-store";
import type { Material } from "@/types/material";

type ProviderMaterialCardProps = {
  material: Material;
  interestCount: number;
  onUpdated: () => void;
  className?: string;
};

export function ProviderMaterialCard({
  material,
  interestCount,
  onUpdated,
  className,
}: ProviderMaterialCardProps) {
  const t = useTranslations("materials.providerCard");
  const tAvail = useTranslations("materials.availability");
  const { formatRelativeTime } = useLocalizedTime();
  const router = useRouter();
  const removeFromStore = useMaterialStore((s) => s.remove);
  const [removing, setRemoving] = useState(false);
  const posted = formatRelativeTime(material.createdAt);
  const updated = formatRelativeTime(material.updatedAt);
  const availabilityKey = material.availabilityFrequency as
    | "one_time"
    | "daily"
    | "weekly"
    | "monthly";
  const availabilityLabel =
    availabilityKey === "one_time"
      ? tAvail("oneTime")
      : availabilityKey === "daily"
        ? tAvail("daily")
        : availabilityKey === "weekly"
          ? tAvail("weekly")
          : availabilityKey === "monthly"
            ? tAvail("monthly")
            : "";
  const completed = isCompletedMaterial(material.status);
  async function handleRemove() {
    const ok = window.confirm(
      t("removeConfirm", { title: material.title })
    );
    if (!ok) return;
    setRemoving(true);
    try {
      await deleteMaterial(material.id);
      removeFromStore(material.id);
      toast.success(t("removed"));
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("removeError"));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5 sm:p-5",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-pretty text-zinc-900">
                {material.title}
              </h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {material.materialType}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">
                {material.quantity} {material.unit}
              </span>
              <span className="text-zinc-400"> · </span>
              {material.location}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {availabilityLabel}
              {posted ? ` · ${t("posted", { time: posted })}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={ROUTES.materialDetail(material.id)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 sm:h-9 sm:min-h-0 sm:w-auto"
            >
              {t("viewDetails")}
            </Link>
            {completed ? null : (
              <>
                <Link
                  href={ROUTES.materialEdit(material.id)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 sm:h-9 sm:min-h-0 sm:w-auto"
                >
                  {t("edit")}
                </Link>
                {interestCount > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-11 w-full sm:h-9 sm:min-h-0 sm:w-auto"
                    onClick={() => router.push(ROUTES.interests)}
                  >
                    {t("viewInterests")}
                  </Button>
                ) : null}
              </>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={removing}
              className="min-h-11 w-full sm:h-9 sm:min-h-0 sm:w-auto"
              onClick={() => void handleRemove()}
            >
              {removing ? t("removing") : t("remove")}
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end sm:text-right">
          <MaterialStatusBadge status={material.status} />
          {!completed && interestCount > 0 ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
              {t("interestCount", { count: interestCount })}
            </span>
          ) : updated ? (
            <span className="text-xs font-medium text-zinc-600">
              {t("lastUpdated", { time: updated })}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
