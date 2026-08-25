"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { MaterialFitBadge } from "@/components/materials/material-fit-badge";
import { MatchLocationNote } from "@/components/materials/match-location-note";
import { ReportActions } from "@/components/reports/report-actions";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";import { cn } from "@/lib/utils";
import type { MatchLocationScope } from "@/lib/match-display";
import { useAuthStore } from "@/store/auth-store";
import type { Material } from "@/types/material";

type MaterialCardProps = {
  material: Material;
  className?: string;
  fitScore?: number | null;
  matchLabel?: string;
  locationScope?: MatchLocationScope;
  locationNote?: string;
  saved?: boolean;
  saveBusy?: boolean;
  onToggleSave?: (materialId: string, currentlySaved: boolean) => void;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function MaterialCard({
  material,
  className,
  fitScore = null,
  matchLabel,
  locationScope,
  locationNote,
  saved = false,
  saveBusy = false,
  onToggleSave,
}: MaterialCardProps) {
  const t = useTranslations("materials.card");
  const tReport = useTranslations("reports");
  const tAvail = useTranslations("materials.availability");
  const { formatRelativeTime } = useLocalizedTime();
  const user = useAuthStore((s) => s.user);
  const posted = formatRelativeTime(material.createdAt);
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
  const canReport =
    user &&
    user.role !== "admin" &&
    user.id !== material.provider.id;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-950/5 transition-all duration-200",
        "hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-950/10",
        className
      )}
    >
      <Link
        href={ROUTES.materialDetail(material.id)}
        className="block cursor-pointer p-4 pr-16 sm:p-5 sm:pr-14"
        aria-label={t("viewAria", { title: material.title })}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-pretty text-base font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-950 sm:truncate">
                {material.title}
              </h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {material.materialSubtype || material.materialType}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600">
              <span className="font-medium text-zinc-800">
                {material.quantity} {material.unit}
              </span>
              <span className="text-zinc-400"> · </span>
              {material.location}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1.5 text-left text-xs text-zinc-500 sm:max-w-[40%] sm:shrink-0 sm:items-end sm:text-right">
            {fitScore != null ? <MaterialFitBadge score={fitScore} /> : null}
            <MatchLocationNote
              locationScope={locationScope}
              locationNote={locationNote}
              className="text-left sm:text-right"
            />
            {matchLabel && fitScore == null ? (
              <p className="text-[11px] font-medium text-zinc-500">{matchLabel}</p>
            ) : null}
            <p className="font-medium text-zinc-700">
              {material.provider.companyName}
            </p>
            <p>{availabilityLabel}</p>
            {posted ? (
              <p className="text-zinc-400">{t("posted", { time: posted })}</p>
            ) : null}
          </div>
        </div>
      </Link>

      {onToggleSave ? (
        <button
          type="button"
          disabled={saveBusy}
          aria-label={saved ? t("removeSaved") : t("saveMaterial")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(material.id, saved);
          }}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:right-4 sm:top-4 sm:h-9 sm:w-9",
            saved && "border-rose-200 text-rose-600 hover:text-rose-700"
          )}
        >
          <HeartIcon filled={saved} />
        </button>
      ) : null}

      {canReport ? (
        <div
          className="border-t border-zinc-100 px-5 py-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ReportActions
            items={[
              {
                label: tReport("actions.material"),
                targetType: "material",
                targetMaterialId: material.id,
                subjectLabel: material.title,
                contextNote: tReport("context.fromMaterialsList", {
                  title: material.title,
                }),
              },
              {
                label: tReport("actions.provider"),
                targetType: "participant",
                targetUserId: material.provider.id,
                subjectLabel: material.provider.companyName,
                contextNote: tReport("context.fromMaterialsListProvider", {
                  title: material.title,
                }),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
