"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { IntroductionRequestModal } from "@/components/participants/introduction-request-modal";
import { ReportActions } from "@/components/reports/report-actions";
import { RoleBadge } from "@/components/trust/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ProviderMatchBuyer } from "@/services/matches/match.service";
import { fetchMaterials } from "@/services/materials/material.service";
import { fetchProfileById } from "@/services/profile/profile.service";
import { useAuthStore } from "@/store/auth-store";
import type { Material } from "@/types/material";
import type { User } from "@/types/user";

type ParticipantProfilePageProps = {
  participantId: string;
};

export function ParticipantProfilePage({ participantId }: ParticipantProfilePageProps) {
  const t = useTranslations("dashboard.participants");
  const tRoles = useTranslations("common.roles");
  const viewer = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [introOpen, setIntroOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const role = useAuthStore.getState().user?.role;
      const [data, mats] = await Promise.all([
        fetchProfileById(participantId),
        role === "material_provider"
          ? fetchMaterials().catch(() => [] as Material[])
          : Promise.resolve([] as Material[]),
      ]);
      setProfile(data.profile);
      setLabels(data.trustSignals?.labels ?? []);
      setMaterials(mats);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [participantId, t]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <div className="h-10 w-1/2 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12">
        <p className="text-sm text-red-700">{error ?? t("notFound")}</p>
        <Link
          href={ROUTES.dashboard}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  const isProviderViewer = viewer?.role === "material_provider";
  const canRequestIntro =
    isProviderViewer && profile.role === "verified_buyer";
  const canReportParticipant =
    viewer &&
    viewer.role !== "admin" &&
    viewer.id !== profile.id;

  const buyerForIntro: ProviderMatchBuyer = {
    buyerId: profile.id,
    companyName: profile.companyName,
    location: profile.location ?? "",
    industryType: profile.industryType ?? "",
    matchPercent: 0,
    reasons: [],
    verificationStatus: profile.verificationStatus,
    memberSince: profile.createdAt,
    lastActiveAt: profile.updatedAt,
    averageResponseTime: profile.averageResponseTime,
    responseRate: profile.responseRate,
    materialInterests: profile.materialTypes ?? [],
  };

  const roleDescription =
    profile.role === "material_provider"
      ? tRoles("material_provider")
      : profile.role === "verified_buyer"
        ? tRoles("verified_buyer")
        : tRoles("admin");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {profile.companyName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{profile.name}</p>
        </div>
        <RoleBadge role={profile.role} />
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">{t("registryContext")}</CardTitle>
          <CardDescription>{roleDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-700">
          {profile.location ? (
            <p>
              <span className="font-medium text-zinc-900">{t("location")} </span>
              {profile.location}
            </p>
          ) : null}
          {profile.industryType ? (
            <p>
              <span className="font-medium text-zinc-900">{t("industry")} </span>
              {profile.industryType}
            </p>
          ) : null}
          {profile.materialTypes?.length ? (
            <div>
              <p className="font-medium text-zinc-900">{t("materialInterests")}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {profile.materialTypes.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {profile.companyDescription ? (
            <p className="leading-relaxed text-zinc-600">
              {profile.companyDescription}
            </p>
          ) : null}
          {labels.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 pt-2">
              {labels.map((label) => (
                <li
                  key={label}
                  className="rounded-md border border-zinc-100 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {canRequestIntro ? (
        <Card id="introduce" className="border-zinc-200/80 scroll-mt-8">
          <CardHeader>
            <CardTitle className="text-base">{t("nextStep")}</CardTitle>
            <CardDescription>{t("nextStepDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-600">{t("nextStepBody")}</p>
            <Button type="button" onClick={() => setIntroOpen(true)}>
              {t("requestIntroduction")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <IntroductionRequestModal
        open={introOpen}
        buyer={buyerForIntro}
        materials={materials}
        onClose={() => setIntroOpen(false)}
      />

      {canReportParticipant ? (
        <ReportActions
          items={[
            {
              label: t("reportParticipant"),
              targetType: "participant",
              targetUserId: profile.id,
              subjectLabel: profile.companyName,
              contextNote: t("reportContext", { name: profile.companyName }),
            },
          ]}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={ROUTES.dashboard}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          {t("navDashboard")}
        </Link>
        {isProviderViewer ? (
          <Link
            href={ROUTES.materials}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            {t("navMaterials")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
