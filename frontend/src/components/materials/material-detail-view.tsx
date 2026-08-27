"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import toast from "react-hot-toast";

import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ExpressInterestModal } from "@/components/interests/express-interest-modal";
import { ReportActions } from "@/components/reports/report-actions";
import { MaterialStatusBadge } from "@/components/materials/material-status-badge";
import { isCompletedMaterial } from "@/components/materials/materials-inventory-utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { toBrowserMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import {
  fetchMyInterestForMaterial,
  fetchMyInterests,
} from "@/services/interests/interest.service";
import { fetchMaterialById, fetchMaterialTimeline, deleteMaterial } from "@/services/materials/material.service";
import {
  fetchSavedMaterials,
  saveMaterialRequest,
  unsaveMaterialRequest,
} from "@/services/saved-materials/saved-material.service";
import { useAuthStore } from "@/store/auth-store";
import { useMaterialStore } from "@/store/material-store";
import type { Interest } from "@/types/interest";
import type { Material } from "@/types/material";
import type { TimelineEvent } from "@/types/timeline";

const COMPACT_TIMELINE_TYPES = [
  "interest_received",
  "interest_accepted",
  "interest_rejected",
  "discussion_opened",
  "workflow_discussion",
  "workflow_pickup_scheduled",
  "workflow_completed",
  "workflow_closed",
  "message_posted",
  "material_status_changed",
] as const;

type CompactTimelineType = (typeof COMPACT_TIMELINE_TYPES)[number];

const BUYER_HIDDEN_TIMELINE_TYPES = new Set<TimelineEvent["type"]>([
  "opportunity_saved",
]);

type MaterialDetailViewProps = {
  materialId: string;
};

const headerActionClass =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 sm:h-9 sm:min-h-0 sm:px-3";

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

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm font-medium leading-relaxed text-zinc-900">{value}</dd>
    </div>
  );
}

export function MaterialDetailView({ materialId }: MaterialDetailViewProps) {
  const t = useTranslations("materials.detail");
  const tCard = useTranslations("materials.providerCard");
  const tf = useTranslations("materials.form.fields");
  const tReport = useTranslations("reports");
  const tAvail = useTranslations("materials.availability");
  const tStatus = useTranslations("materials.status");
  const { formatRelativeTime } = useLocalizedTime();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const upsert = useMaterialStore((s) => s.upsert);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestOpen, setInterestOpen] = useState(false);
  const [myInterest, setMyInterest] = useState<Interest | null>(null);
  const [materialInterests, setMaterialInterests] = useState<Interest[]>([]);
  const [interestChecked, setInterestChecked] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInterestChecked(false);
    try {
      const m = await fetchMaterialById(materialId);
      setMaterial(m);
      upsert(m);

      const isProviderOwner =
        user?.role === "material_provider" && user.id === m.provider.id;

      if (user?.role === "verified_buyer") {
        const [mine, savedList] = await Promise.all([
          fetchMyInterestForMaterial(materialId).catch(() => null),
          fetchSavedMaterials().catch(() => []),
        ]);
        setMyInterest(mine);
        setMaterialInterests([]);
        setIsSaved(savedList.some((s) => s.materialId === materialId));
        setTimeline([]);
      } else if (isProviderOwner) {
        const [ints, tl] = await Promise.all([
          fetchMyInterests().catch(() => [] as Interest[]),
          fetchMaterialTimeline(materialId).catch(() => []),
        ]);
        setMaterialInterests(ints.filter((i) => i.materialId === materialId));
        setMyInterest(null);
        setTimeline(tl);
      } else {
        const tl = await fetchMaterialTimeline(materialId).catch(() => []);
        setMyInterest(null);
        setMaterialInterests([]);
        setTimeline(tl);
      }
      setInterestChecked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
      setMyInterest(null);
      setMaterialInterests([]);
      setInterestChecked(true);
    } finally {
      setLoading(false);
    }
  }, [materialId, upsert, user, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const providerTimeline = useMemo(
    () => timeline.filter((ev) => !BUYER_HIDDEN_TIMELINE_TYPES.has(ev.type)),
    [timeline]
  );

  async function handleRemove() {
    if (!material) return;
    const ok = window.confirm(
      tCard("removeConfirm", { title: material.title })
    );
    if (!ok) return;
    setRemoving(true);
    try {
      await deleteMaterial(material.id);
      useMaterialStore.getState().remove(material.id);
      toast.success(tCard("removed"));
      router.push(ROUTES.materials);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tCard("removeError"));
    } finally {
      setRemoving(false);
    }
  }

  async function toggleSave() {
    setSaveBusy(true);
    try {
      if (isSaved) {
        await unsaveMaterialRequest(materialId);
        setIsSaved(false);
      } else {
        await saveMaterialRequest(materialId);
        setIsSaved(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveListError"));
    } finally {
      setSaveBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-1 sm:space-y-5 sm:py-4">
        <div className="h-8 w-40 max-w-full animate-pulse rounded-md bg-zinc-100" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-zinc-100" />
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-100 sm:aspect-[16/9]" />
        <div className="h-56 animate-pulse rounded-2xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6 sm:py-12">
        <p className="text-sm leading-relaxed text-red-700">{error ?? t("notFound")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => router.back()}
          >
            {t("goBack")}
          </Button>
          <Link
            href={ROUTES.materials}
            className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-zinc-700 underline-offset-4 hover:underline sm:min-h-0"
          >
            {t("backToMaterials")}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner =
    user?.id === material.provider.id && user?.role === "material_provider";
  const isBuyer = user?.role === "verified_buyer";
  const canExpress =
    isBuyer &&
    interestChecked &&
    !myInterest &&
    material.provider.id !== user?.id;
  const interestActive =
    myInterest &&
    ["accepted", "discussion", "pickup_scheduled", "completed"].includes(
      myInterest.status
    );
  const canReportListing =
    user && user.role !== "admin" && !isOwner && material.provider.id !== user.id;
  const recentTimeline = providerTimeline.slice(0, 3);
  const hasMoreTimeline = providerTimeline.length > 3;

  const availabilityLabel =
    material.availabilityFrequency === "one_time"
      ? tAvail("oneTime")
      : material.availabilityFrequency === "daily"
        ? tAvail("daily")
        : material.availabilityFrequency === "weekly"
          ? tAvail("weekly")
          : material.availabilityFrequency === "monthly"
            ? tAvail("monthly")
            : "";

  const statusLabel =
    material.status === "available"
      ? tStatus("available")
      : material.status === "in_discussion"
        ? tStatus("inDiscussion")
        : material.status === "fulfilled"
          ? tf("statusFulfilled")
          : material.status === "archived"
            ? tStatus("archived")
            : material.status;

  const optionalFields = [
    material.industryType
      ? { label: tf("industryContext"), value: material.industryType }
      : null,
    material.estimatedValueRange
      ? { label: tf("valueRange"), value: material.estimatedValueRange }
      : null,
    material.pickupAvailable
      ? { label: tf("pickupOnSite"), value: t("pickupYes") }
      : null,
    isOwner && material.availabilityFrequency !== "one_time" && availabilityLabel
      ? { label: tf("availabilityRhythm"), value: availabilityLabel }
      : null,
    isOwner && material.visibility === "restricted"
      ? { label: tf("visibility"), value: tf("visibilityRestricted") }
      : null,
    isOwner && material.status !== "available"
      ? { label: tf("status"), value: statusLabel }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:space-y-8 sm:pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={ROUTES.materials}
          className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 sm:min-h-0"
        >
          ← {t("backToMaterials")}
        </Link>
        {isOwner ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {!isCompletedMaterial(material.status) ? (
              <Link
                href={ROUTES.materialEdit(materialId)}
                className={cn(headerActionClass, "w-full sm:w-auto")}
              >
                {t("editMaterial")}
              </Link>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={removing}
              className={cn(headerActionClass, "w-full sm:w-auto")}
              onClick={() => void handleRemove()}
            >
              {removing ? tCard("removing") : tCard("remove")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <MaterialStatusBadge status={material.status} />
        </div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
          {material.title}
        </h1>
        {!isOwner ? (
          <p className="text-sm leading-relaxed text-pretty text-zinc-600">
            {t("listedBy", { company: material.provider.companyName })}
          </p>
        ) : null}
      </div>

      {material.imageUrls?.length ? (
        <div
          className={cn(
            "grid gap-3",
            material.imageUrls.length === 1
              ? "grid-cols-1"
              : material.imageUrls.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-3"
          )}
        >
          {material.imageUrls.map((url) => (
            <a
              key={url}
              href={toBrowserMediaUrl(url)}
              target="_blank"
              rel="noreferrer"
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
            >
              <img
                src={toBrowserMediaUrl(url)}
                alt={material.title}
                className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
              />
            </a>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.04] sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">
          {t("materialInfo")}
        </h2>

        <dl className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
          <DetailField label={tf("materialCategory")} value={material.materialType} />
          <DetailField
            label={tf("material")}
            value={material.materialSubtype || material.materialType}
          />
          <DetailField label={tf("materialForm")} value={material.materialForm} />
          <DetailField label={tf("cleanliness")} value={material.cleanliness} />
          <DetailField
            label={tf("quantity")}
            value={`${material.quantity} ${material.unit}`}
          />
          <DetailField label={tf("location")} value={material.location} />
          {optionalFields.map((field) => (
            <DetailField
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </dl>

        {material.description ? (
          <div className="mt-6 border-t border-zinc-100 pt-5 sm:mt-8 sm:pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {tf("description")}
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-pretty text-zinc-700">
              {material.description}
            </p>
          </div>
        ) : null}
      </section>

      {isBuyer ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.04] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saveBusy}
              onClick={() => void toggleSave()}
              className={cn(
                "min-h-11 w-full sm:w-auto",
                isSaved && "border-rose-200 text-rose-600 hover:text-rose-700"
              )}
            >
              <HeartIcon filled={isSaved} />
              <span className="ml-2">{isSaved ? t("saved") : t("save")}</span>
            </Button>
            {canExpress ? (
              <Button
                type="button"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setInterestOpen(true)}
              >
                {t("expressInterest")}
              </Button>
            ) : null}
            {myInterest?.status === "pending" ? (
              <span className="px-1 text-sm font-medium text-zinc-700">
                {t("interestPending")}
              </span>
            ) : null}
            {interestActive ? (
              <Link
                href={ROUTES.interestsOpen(myInterest!.id)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:w-auto"
              >
                {t("openInbox")}
              </Link>
            ) : null}
          </div>
          {canReportListing ? (
            <ReportActions
              className="mt-4 border-t border-zinc-100 pt-4"
              buttonClassName="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline sm:min-h-0 sm:text-xs"
              items={[
                {
                  label: tReport("actions.material"),
                  targetType: "material",
                  targetMaterialId: material.id,
                  subjectLabel: material.title,
                  contextNote: tReport("context.fromMaterialDetail", {
                    title: material.title,
                  }),
                },
                {
                  label: tReport("actions.provider"),
                  targetType: "participant",
                  targetUserId: material.provider.id,
                  subjectLabel: material.provider.companyName,
                  contextNote: tReport("context.fromMaterialDetailProvider", {
                    title: material.title,
                  }),
                },
              ]}
            />
          ) : null}
        </section>
      ) : null}

      {isOwner ? (
        <section
          className={cn(
            "rounded-2xl border p-4 sm:p-6",
            materialInterests.length > 0
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-zinc-200/80 bg-zinc-50/80"
          )}
        >
          {materialInterests.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-pretty text-emerald-900">
                  {t("buyersInterested", { count: materialInterests.length })}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800/90">
                  {t("reviewInbox")}
                </p>
              </div>
              <Link
                href={ROUTES.interests}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:h-9 sm:min-h-0 sm:w-auto"
              >
                {t("viewInbox")}
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-zinc-900">{t("noBuyerInterest")}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {t("published", { time: formatRelativeTime(material.createdAt) })}
              </p>
            </div>
          )}
        </section>
      ) : null}

      {isOwner && providerTimeline.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.04] sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">
            {t("recentActivity")}
          </h2>
          <div className="mt-4">
            {timelineExpanded ? (
              <ActivityTimeline items={providerTimeline} />
            ) : (
              <ul className="space-y-2">
                {recentTimeline.map((ev) => (
                  <li key={ev.id} className="text-sm leading-relaxed text-zinc-800">
                    <span className="text-zinc-400">•</span>{" "}
                    {COMPACT_TIMELINE_TYPES.includes(ev.type as CompactTimelineType)
                      ? t(`timeline.${ev.type as CompactTimelineType}`)
                      : ev.summary}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {hasMoreTimeline ? (
            <button
              type="button"
              onClick={() => setTimelineExpanded((open) => !open)}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-zinc-800 underline-offset-4 hover:underline sm:min-h-0"
            >
              {timelineExpanded ? t("showLess") : t("viewFullTimeline")}
            </button>
          ) : null}
        </section>
      ) : null}

      {isBuyer && canExpress ? (
        <ExpressInterestModal
          open={interestOpen}
          materialId={materialId}
          onClose={() => setInterestOpen(false)}
          onSubmitted={() => void load()}
        />
      ) : null}
    </div>
  );
}
